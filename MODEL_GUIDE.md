# 智慧医疗AI助手 - 本地模型接入说明

## 当前使用的模型

本项目已接入**本地Ollama模型**，具体配置如下：

### 已安装的本地模型

1. **medical-v1** (4.7 GB) - 医疗专用模型（推荐使用）
2. **qwen2.5** (4.7 GB) - 通义千问2.5模型（备用）

### 模型服务状态

- **Ollama服务**: 已安装并运行在 `http://localhost:11434`
- **API端点**: `http://localhost:11434/api/chat`
- **当前使用**: medical-v1（优先），失败时自动切换到 qwen2.5

## 如何使用

### 1. 确保Ollama服务运行

```bash
# 检查Ollama服务状态
curl http://localhost:11434/api/tags

# 查看已安装模型
ollama list
```

### 2. 启动应用

```bash
npm install
npm run dev
```

### 3. 使用智能问诊功能

在应用的"智能问诊"页面，可以：
- 输入症状描述，如"我最近总是头疼"
- 选择常见症状快速咨询
- AI会使用本地模型进行分析并给出建议

## 模型配置说明

### 配置文件位置

- 前端配置: `src/services/ollama.js`
- API服务: `src/services/api.js`

### 关键配置参数

```javascript
// src/services/api.js
const USE_LOCAL_MODEL = true  // 是否使用本地模型（true=使用本地，false=使用模拟数据）
```

### 模型参数

- **temperature**: 0.7（控制输出随机性）
- **top_p**: 0.9（控制采样范围）
- **max_tokens**: 2000（最大生成长度）

## 医疗模型特点

### medical-v1 模型优势

- ✅ 专门针对医疗场景训练
- ✅ 理解医学术语和症状
- ✅ 提供合规的医疗建议
- ✅ 自动识别紧急情况
- ✅ 推荐相关科室

### 合规保护机制

1. **系统提示词**：明确AI的辅助定位，不能替代医生
2. **紧急情况检测**：自动识别胸痛、呼吸困难等紧急症状
3. **结构化输出**：包含症状分析、可能原因、推荐科室、紧急程度
4. **免责声明**：所有回复均标注"仅供参考，不构成医疗建议"

## 备用方案

当本地模型不可用时，系统会自动切换到备用方案：

1. **备用模型**：自动尝试使用 qwen2.5
2. **模拟数据**：使用预设的医疗知识库规则匹配

## 性能优化

### 响应时间

- 本地模型: 2-5秒（取决于硬件配置）
- 模拟数据: 1.5秒（固定延迟）

### 硬件要求

- **最低**: 8GB RAM
- **推荐**: 16GB+ RAM, GPU支持

## 其他本地模型方案

如果需要使用其他本地模型框架：

### vLLM
```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server --model /path/to/medical-model
```

### LM Studio
1. 下载 LM Studio
2. 加载医疗模型
3. 启动本地服务器
4. 修改 API 端点配置

## 故障排查

### 问题1: 连接Ollama失败

**检查服务是否运行:**
```bash
ps aux | grep ollama
```

**重启Ollama:**
```bash
ollama serve
```

### 问题2: 模型响应慢

**检查系统资源:**
```bash
top  # 或 htop
```

**建议:** 使用GPU加速或减少模型参数量

### 问题3: 使用模拟数据

**检查配置:**
```javascript
// src/services/api.js
const USE_LOCAL_MODEL = true  // 确保为true
```

## 扩展到云端模型

如需接入云端医疗大模型，可以修改 `src/services/api.js`：

```javascript
// 示例：接入通义千问医疗版
import { chatWithQwenMedical } from './services/qwen'

export async function chatWithAI(message) {
  if (USE_CLOUD_MODEL) {
    return await chatWithQwenMedical(message)
  }
  // ... 本地模型逻辑
}
```

## 相关资源

- [Ollama官方文档](https://ollama.ai/docs)
- [通义千问医疗版](https://help.aliyun.com/zh/dashscope/)
- [讯飞星火医疗大模型](https://www.xfyun.cn/doc/spark/Introduction.html)
- [医疗AI合规指南](https://www.nhc.gov.cn/)
