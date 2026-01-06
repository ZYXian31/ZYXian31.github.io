---
title: 'CS336 Lecture 3: LM架构与训练 - 学习笔记'
date: 2025-07-05 14:54:38
tags:
  - CS336
  - 深度学习
  - LLM
  - Transformer
categories:
  - 学习笔记
---

> **课程主题：** 深入分析大型语言模型的架构设计与训练技术
> **日期：** 2025-07-05

---

## 📋 课程概述

本节课深入探讨了大型语言模型（LLM）的架构设计和训练过程中的关键技术选择。通过分析多个主流模型的实际配置，总结出架构设计的共性与差异，为实际开发提供指导。

### 🎯 主要内容结构

1. **Transformer架构回顾与现代变体**
2. **架构组件的设计选择**
3. **超参数设置的经验法则**
4. **训练稳定性技巧**
5. **注意力机制的优化变体**

---

## 🏗️ 内容 1: Transformer架构基础

### 1.1 标准Transformer vs 现代变体

**原始Transformer的特点：**

- 位置编码：正弦余弦函数
- 前馈网络：ReLU激活
- 归一化：Post-norm LayerNorm（在残差连接后面）

**现代实现的改进：**

- **Pre-norm结构**：在残差连接之前在多头注意力计算之前进行归一化
- **RoPE位置编码**：旋转位置嵌入
- **SwiGLU激活**：替代ReLU
- **无偏置项**：线性层和LayerNorm不使用bias

### 1.2 架构选择的考量原则

- 从实际部署的大模型中学习经验
- 重视计算效率与性能的平衡
- 考虑训练稳定性和可扩展性

---

## 🔧 内容 2: 关键架构组件设计

### 2.1 归一化层设计

#### Pre-norm vs Post-norm

**Pre-norm结构：**
```
x → LayerNorm → MultiHeadAttention → Add → LayerNorm → FFN → Add
```

**Post-norm结构：**
```
x → MultiHeadAttention → Add → LayerNorm → FFN → Add → LayerNorm
```

**Pre-norm优势：**

- 保持残差连接的主要信号路径（原始的 x 一直贯穿整个通路）
- 梯度传播更稳定，减少梯度爆炸（PostNorm 深层的梯度更大，训练更不稳定）
- 支持更大的学习率
- 几乎所有现代LM都采用Pre-norm（除了OPT350M）

#### LayerNorm vs RMSNorm

**RMSNorm的优势：**

- 计算更高效（不需要计算均值和偏置项）
- 效果与LayerNorm相当
- 参数更少（无bias项β）
- 内存访问模式更优

---

## 📍 内容 3: 位置编码技术

### 3.1 位置编码类型对比

**正弦编码：**
$$PE(pos, 2i) = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right)$$
$$PE(pos, 2i+1) = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)$$

**绝对位置嵌入：**
$$Embed(x, i) = v_x + u_i$$

**相对位置嵌入：**
$$Embed(x, i) = v_x + RelativeEmbedding(i - j)$$

### 3.2 RoPE（旋转位置嵌入）

**设计理念：**

相对位置嵌入应满足：
$$\langle f(x, i), f(y, j) \rangle = g(x, y, i - j)$$

**RoPE的数学实现：**

对于2D情况，旋转矩阵为：
$$R_\theta = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$$

**优势：**

- 真正的相对位置感知
- 避免了正弦编码的交叉项问题
- 大多数2024+模型的标准选择

---

## 📊 内容 4: 超参数设计经验

### 4.1 前馈维度比例

#### 标准比例关系

**基本经验法则：**
$$d_{ff} = 4 \times d_{model}$$

**GLU变体的调整：**
$$d_{ff} = \frac{8}{3} \times d_{model} \approx 2.67 \times d_{model}$$

**实际模型案例：**

| 模型 | $d_{ff}/d_{model}$ | 备注 |
|------|---------------------|------|
| PaLM | 4.0 | 标准比例 |
| Mistral 7B | 3.5 | GLU变体 |
| LLaMA-2 70B | 3.5 | GLU变体 |
| LLaMA 70B | 2.68 | GLU变体 |
| T5 11B | 64.0 | 极端案例 |
| T5 v1.1 | 2.5 | 修正后 |

### 4.2 注意力头配置

#### 头维度设计原则

**标准配置：**
$$head\_dim \times num\_heads = d_{model}$$

**实际案例：**

| 模型 | 头数 | 头维度 | 模型维度 | 比例 |
|------|------|--------|----------|------|
| GPT-3 | 96 | 128 | 12288 | 1.0 |
| LLaMA-2 70B | 64 | 128 | 8192 | 1.0 |
| Mistral 7B | 32 | 128 | 4096 | 1.0 |

---

## 🛡️ 内容 5: 训练稳定性技巧

### 5.1 梯度裁剪

```python
# 标准梯度裁剪
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
```

### 5.2 学习率调度

**Warmup + Cosine Decay：**

```python
def lr_schedule(step, warmup_steps, total_steps, max_lr, min_lr):
    if step < warmup_steps:
        return max_lr * step / warmup_steps
    else:
        progress = (step - warmup_steps) / (total_steps - warmup_steps)
        return min_lr + 0.5 * (max_lr - min_lr) * (1 + cos(pi * progress))
```

### 5.3 权重衰减

- 通常设置为 0.1
- 不对偏置项和 LayerNorm 参数应用

---

## ⚡ 内容 6: 注意力机制优化

### 6.1 Grouped Query Attention (GQA)

**核心思想：** 多个查询头共享同一组键值头

**优势：**
- 减少 KV Cache 内存占用
- 推理速度更快
- 性能损失很小

### 6.2 Flash Attention

**核心优化：**
- IO-aware 的注意力计算
- 分块计算减少内存访问
- 在线 softmax 算法

---

## 📋 总结与要点

1. **架构选择的核心原则**
   - Pre-norm 优于 Post-norm
   - RMSNorm 是 LayerNorm 的高效替代
   - RoPE 是位置编码的主流选择

2. **超参数设置的经验法则**
   - FFN 维度约为模型维度的 4 倍（非 GLU）或 2.67 倍（GLU）
   - 头维度通常为 64 或 128

3. **训练稳定性的关键**
   - 梯度裁剪
   - 学习率 warmup
   - 适当的权重衰减

4. **效率优化的方向**
   - GQA 减少 KV Cache
   - Flash Attention 优化内存访问

---

## 📚 参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)
- [Flash Attention](https://arxiv.org/abs/2205.14135)
- [LLaMA: Open and Efficient Foundation Language Models](https://arxiv.org/abs/2302.13971)

