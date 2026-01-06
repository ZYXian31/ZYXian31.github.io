---
title: 'CS336 Language Modeling: Tensors, Operations & Training'
date: 2025-07-05 14:54:38
tags:
  - CS336
  - 深度学习
  - LLM
categories:
  - 学习笔记
---

## 课程概述

本讲座深入探讨了语言模型训练的核心组件，从底层的张量操作到完整的训练循环。重点关注**资源利用**（内存和计算）的精确计算。

### 主要内容结构

- **张量基础** → **模型构建** → **优化器** → **训练循环**
- **资源核算**：内存（GB）+ 计算（FLOPs）

---

## 💡 动机：快速计算题

### 问题1：训练时间估算

**70B参数模型，15T tokens，1024 H100s需要多长时间？**

```python
total_flops = 6 * 70e9 * 15e12  # 6倍规则
mfu = 0.5  # 模型FLOPs利用率
flops_per_day = h100_flop_per_sec * mfu * 1024 * 60 * 60 * 24
days = total_flops / flops_per_day
```

### 问题2：内存限制

**8个H100上用AdamW能训练多大的模型？**

```python
h100_bytes = 80e9  # 80GB
bytes_per_parameter = 4 + 4 + (4 + 4)  # 参数+梯度+优化器状态
num_parameters = (h100_bytes * 8) / bytes_per_parameter
```

---

## 📊 张量与内存

### 数据类型对比

| 类型 | 字节 | 优势 | 劣势 |
|------|------|------|------|
| **float32** | 4 | 高精度，稳定 | 内存占用大 |
| **float16** | 2 | 节省内存 | 动态范围小，易下溢 |
| **bfloat16** | 2 | 与fp32相同动态范围 | 精度略低 |
| **fp8** | 1 | 极省内存 | 精度最低，需特殊硬件 |

---

## ⚡ 计算量核算（FLOPs）

### 核心公式

- **前向传播**：`2 × (数据点数) × (参数数)` FLOPs
- **反向传播**：`4 × (数据点数) × (参数数)` FLOPs
- **总计**：`6 × (数据点数) × (参数数)` FLOPs

### 矩阵乘法：`A(m×n) × B(n×p)`

```
FLOPs = 2 × m × n × p
```

### 模型FLOPs利用率（MFU）

```python
MFU = (实际 FLOP/s) / (理论峰值 FLOP/s)
```

- **优秀标准**：MFU ≥ 0.5
- **影响因素**：硬件类型、数据类型、算法优化

---

## 🎯 Einops：优雅的张量操作

### 为什么使用Einops？

- **可读性**：维度有明确语义

### 三大核心操作

#### 1. `einsum`：广义矩阵乘法

```python
# 传统方式
z = x @ y.transpose(-2, -1)

# Einops方式
z = einsum(x, y, "batch seq1 hidden, batch seq2 hidden -> batch seq1 seq2")
```

#### 2. `reduce`：维度约简

```python
# 传统方式
y = x.mean(dim=-1)

# Einops方式
y = reduce(x, "... hidden -> ...", "mean")
```

#### 3. `rearrange`：重新排列

```python
# 分解维度
x = rearrange(x, "... (heads hidden) -> ... heads hidden", heads=2)

# 合并维度
x = rearrange(x, "... heads hidden -> ... (heads hidden)")
```

---

## 🧠 模型构建

### 参数初始化的关键问题

**问题**：`torch.randn(input_dim, output_dim)` 会导致输出随输入维度缩放

**解决方案**：Xavier初始化

```python
# 标准初始化（避免输出随输入维度缩放）
w = nn.Parameter(torch.randn(input_dim, output_dim) / np.sqrt(input_dim))

# 截断正态分布（更安全）
w = nn.Parameter(nn.init.trunc_normal_(
    torch.empty(input_dim, output_dim), 
    std=1/np.sqrt(input_dim), 
    a=-3, b=3  # 范围约束在 [-3, 3]
))
```

### 自定义模型示例

```python
class Cruncher(nn.Module):
    def __init__(self, dim: int, num_layers: int):
        super().__init__()
        self.layers = nn.ModuleList([
            Linear(dim, dim) for _ in range(num_layers)
        ])
        self.final = Linear(dim, 1)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        for layer in self.layers:
            x = layer(x)
        return self.final(x).squeeze(-1)
```

---

## 🔧 优化器演进

### 优化器家族树

```
SGD → SGD + momentum → AdaGrad → RMSProp → Adam
```

### 各优化器核心思想

#### 1. **SGD (Stochastic Gradient Descent)**

```python
# 核心思想：最简单的梯度下降
# 更新公式：θ = θ - lr * grad
p.data -= lr * grad
```

- **优点**：简单，内存效率高
- **缺点**：收敛慢，对学习率敏感

#### 2. **SGD + Momentum**

```python
# 核心思想：利用历史梯度信息，加速收敛
# 更新公式：v = β * v + grad; θ = θ - lr * v
velocity = beta * velocity + grad
p.data -= lr * velocity
```

- **优点**：收敛更快，能跨越小的局部最优

#### 3. **AdaGrad**

```python
# 核心思想：自适应学习率，频繁更新的参数学习率逐渐减小
# 更新公式：G = G + grad²; θ = θ - lr * grad / √(G + ε)
```

- **优点**：自适应学习率，适合稀疏数据
- **缺点**：学习率单调递减，可能过早停止学习

#### 4. **RMSProp**

```python
# 核心思想：修复AdaGrad学习率过度衰减问题
# 更新公式：G = β * G + (1-β) * grad²; θ = θ - lr * grad / √(G + ε)
```

- **优点**：解决AdaGrad学习率衰减问题

#### 5. **Adam**

```python
# 核心思想：结合momentum和RMSProp的优点
# 更新公式：m = β₁ * m + (1-β₁) * grad; v = β₂ * v + (1-β₂) * grad²
#          θ = θ - lr * m̂ / (√v̂ + ε)
```

- **优点**：结合了momentum和自适应学习率
- **缺点**：内存占用较大，有时收敛不如SGD

---

## 📈 训练循环与最佳实践

### 完整训练循环

```python
def train_step(model, optimizer, get_batch, B):
    # 获取数据
    x, y = get_batch(B)
    
    # 前向传播
    pred_y = model(x)
    loss = F.mse_loss(pred_y, y)
    
    # 反向传播
    loss.backward()
    
    # 更新参数
    optimizer.step()
    optimizer.zero_grad(set_to_none=True)
    
    return loss.item()
```

### 关键最佳实践

#### 1. 随机性控制

```python
def set_seed(seed=0):
    torch.manual_seed(seed)
    np.random.seed(seed)
    random.seed(seed)
```

#### 2. 大数据处理

```python
# 使用memory mapping避免一次性加载
data = np.memmap("data.npy", dtype=np.int32)

# 异步数据传输
x = x.pin_memory().to(device, non_blocking=True)
```

#### 3. 检查点保存

```python
checkpoint = {
    "model": model.state_dict(),
    "optimizer": optimizer.state_dict(),
    "step": step,
    "loss": loss
}
torch.save(checkpoint, "checkpoint.pt")
```

---

## 🎨 混合精度训练

### 核心思想

**默认高精度，如果降低精度没有影响则降低精度**

### 策略

- **前向传播**：使用 bfloat16/fp8（节省内存和计算）
- **参数存储**：使用 float32（保证精度）
- **梯度计算**：使用 float32（保证稳定性）

### PyTorch AMP 实现

```python
scaler = GradScaler()

with autocast():
    outputs = model(inputs)
    loss = criterion(outputs, targets)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

---

## 📊 资源核算总结

### 内存组成

1. **模型参数**
2. **优化器状态**（通常与参数同量级）
3. **梯度**（与参数同量级）
4. **激活值**（取决于batch size和序列长度）

### 计算量估算

```python
# 每个训练步骤的总FLOPs
total_flops = 6 * batch_size * seq_len * num_parameters

# 考虑实际利用率
effective_flops = total_flops * mfu
```

---

## 🔗 延伸阅读

### 核心资源

- [Assignment 1 Handout](https://github.com/stanford-cs336/assignment1-basics/blob/main/cs336_spring2025_assignment1_basics.pdf)
- [Mathematical Transformers](https://johnthickstun.com/docs/transformers.pdf)
- [Illustrated Transformer](http://jalammar.github.io/illustrated-transformer/)

### 深入理解

- [Transformer内存使用详解](https://erees.dev/transformer-memory/)
- [Transformer FLOPs计算](https://www.adamcasson.com/posts/transformer-flops)
- [语言模型训练的FLOPs计算](https://medium.com/@dzmitrybahdanau/the-flops-calculus-of-language-model-training-3b19c1f025e4)

---

## 🎯 关键要点

1. **资源核算是必备技能**：训练大模型前必须精确计算内存和计算需求
2. **矩阵乘法主导计算**：优化重点应放在线性层
3. **混合精度是趋势**：在保证稳定性的前提下最大化效率
4. **工程实践同样重要**：检查点、数据加载、随机性控制都是成功训练的关键

> 💡 **记住**：Modern AI训练不仅是算法问题，更是工程优化问题！

