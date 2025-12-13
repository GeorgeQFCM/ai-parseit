<template>
  <div>
    <h2 class="section-title">AI大模型配置</h2>

    <div class="config-card">
      <el-form :model="aiConfig" label-width="120px" class="max-w-2xl">
        <el-form-item label="API地址" required>
          <el-input
            v-model="aiConfig.apiUrl"
            placeholder="https://api.openai.com/v1/chat/completions"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="API密钥" required>
          <el-input
            v-model="aiConfig.apiKey"
            type="password"
            placeholder="请输入API密钥"
            show-password
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="模型名称" required>
          <el-input
            v-model="aiConfig.apiModel"
            placeholder="gpt-4o / claude-3-sonnet / qwen-max"
          >
            <template #prefix>
              <el-icon><Cpu /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="提示词模式">
          <el-radio-group v-model="promptMode">
            <el-radio value="auto">自动生成（推荐）</el-radio>
            <el-radio value="custom">自定义提示词</el-radio>
          </el-radio-group>
          <div class="text-xs text-gray-500 mt-1">
            自动生成模式会根据字段配置动态生成提示词，自定义模式允许您完全控制提示词内容
          </div>
        </el-form-item>

        <el-form-item v-if="promptMode === 'custom'" label="自定义提示词">
          <el-input
            v-model="aiConfig.prompt"
            type="textarea"
            :rows="8"
            placeholder="请输入自定义AI提示词..."
          />
        </el-form-item>

        <el-form-item label="请求超时">
          <el-input-number v-model="aiConfig.timeout" :min="10" :max="300" />
          秒
        </el-form-item>

        <el-form-item label="重试次数">
          <el-input-number v-model="aiConfig.retryCount" :min="0" :max="5" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="$emit('save-config')">
            <el-icon><Check /></el-icon> 保存配置
          </el-button>
          <el-button
            type="success"
            @click="testConnection"
            :loading="isTestingAi"
          >
            <el-icon><Connection /></el-icon> 测试连接
          </el-button>
          <el-button @click="$emit('reset-config')">
            <el-icon><RefreshRight /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Connection Status -->
    <div v-if="aiTestResult" class="mt-4">
      <el-alert
        :title="aiTestResult.success ? '连接成功' : '连接失败'"
        :type="aiTestResult.success ? 'success' : 'error'"
        :description="aiTestResult.message"
        show-icon
        closable
        @close="aiTestResult = null"
      />
    </div>

    <!-- Dynamic Prompt Preview -->
    <div
      v-if="promptMode === 'auto' && fieldConfig.length > 0"
      class="config-card mt-6"
    >
      <h3 class="font-semibold text-gray-700 mb-4">🤖 动态生成的提示词预览</h3>
      <div
        class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto"
      >
        {{ generatedPrompt }}
      </div>
      <div class="mt-3 text-xs text-gray-500">
        此提示词将根据您的字段配置自动生成，无需手动编写
      </div>
    </div>

    <!-- Default Prompt Template -->
    <div v-if="promptMode === 'custom'" class="config-card mt-6">
      <h3 class="font-semibold text-gray-700 mb-4">📝 提示词模板参考</h3>
      <div
        class="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto"
      >
        {{ defaultPrompt }}
      </div>
      <el-button
        type="primary"
        plain
        size="small"
        class="mt-3"
        @click="aiConfig.prompt = defaultPrompt"
      >
        使用此模板
      </el-button>
    </div>

    <!-- Field Configuration Hint -->
    <div v-if="fieldConfig.length === 0" class="config-card mt-6">
      <div class="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
        <el-icon :size="20" color="#f59e0b"><Warning /></el-icon>
        <div>
          <div class="font-medium text-yellow-800">字段配置为空</div>
          <div class="text-sm text-yellow-600 mt-1">
            请先配置要提取的字段，这样AI才能知道需要提取哪些信息
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  Link,
  Key,
  Cpu,
  Check,
  Connection,
  RefreshRight,
  Warning,
} from "@element-plus/icons-vue";

const props = defineProps({
  aiConfig: {
    type: Object,
    required: true,
  },
  fieldConfig: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["save-config", "test-connection", "reset-config"]);

const isTestingAi = ref(false);
const aiTestResult = ref(null);
const promptMode = ref("auto");

// 动态生成的提示词
const generatedPrompt = computed(() => {
  if (props.fieldConfig.length === 0) {
    return "请先配置字段，系统将自动生成提示词";
  }

  const fieldDescriptions = props.fieldConfig
    .map((field) => {
      let desc = `- ${field.id}: ${field.name}`;
      if (field.type === "number") {
        desc += ` (数字类型${field.unit ? `，单位：${field.unit}` : ""})`;
      } else if (field.type === "date") {
        desc += " (日期类型，格式：YYYY-MM-DD)";
      } else if (field.type === "boolean") {
        desc += " (布尔类型，true/false)";
      } else if (field.type === "select" && field.options) {
        desc += ` (选择类型，可选值：${field.options.join("、")})`;
      }
      if (field.required) {
        desc += " [必填]";
      }
      if (field.description) {
        desc += ` - ${field.description}`;
      }
      return desc;
    })
    .join("\n");

  const exampleData = {};
  props.fieldConfig.forEach((field) => {
    switch (field.type) {
      case "number":
        exampleData[field.id] = field.unit === "元" ? 100.0 : 1;
        break;
      case "date":
        exampleData[field.id] = "2024-01-01";
        break;
      case "boolean":
        exampleData[field.id] = true;
        break;
      case "select":
        exampleData[field.id] = field.options?.[0] || "选项1";
        break;
      default:
        exampleData[field.id] = `示例${field.name}`;
    }
  });

  return `你是一个专业的PDF数据提取助手。请从以下PDF内容中提取信息，并以JSON数组格式返回。

需要提取的字段：
${fieldDescriptions}

注意事项：
- 返回JSON数组，每个元素代表一条记录
- 如果有多条记录，请分别提取
- 如果字段信息不完整或找不到，用null表示
- 数字类型请确保返回数字格式
- 日期类型请使用YYYY-MM-DD格式
- 仅返回JSON数组，不要其他说明文字

示例输出格式：
[
  ${JSON.stringify(exampleData, null, 2)}
]

PDF内容：`;
});

const defaultPrompt = `你是一个专业的合同信息提取助手。请从以下合同内容中提取信息，并以JSON数组格式返回。

需要提取的信息：
1. orderNo: 订单编号/合同编号
2. products: 产品列表数组，每个产品包含：
   - name: 产品名称
   - color: 颜色
   - package: 包装
   - quantity: 数量
   - unit: 单位
   - unitPrice: 单价（数字类型，如有多项费用请计算总单价）
   - remark: 备注（可选）

注意事项：
- 如果有多个产品，请分别提取
- 跳过总价或单价为负数的产品
- 单价需要包含所有附加费用（如开模费、定制费、加工费、运费、安装费等）
- 如果费用没有单价，需要使用总价/数量计算出单价，保留两位小数
- 如果备注中表示需要加收的金额，也需要增加到单价中
- 如果备注中表示单价已包含加收,则不需要增加到单价中
- 如果信息不完整，用null表示
- 仅返回JSON数组，不要其他说明

示例输出格式：
[
  {
    "orderNo": "PO-2024-001",
    "name": "产品A",
    "color": "红色",
    "package": "中文包装",
    "quantity": 500,
    "unit": "个",
    "unitPrice": 15000.00,
    "remark": "备注信息"
  }
]

合同内容：`;

const testConnection = async () => {
  if (
    !props.aiConfig.apiUrl ||
    !props.aiConfig.apiKey ||
    !props.aiConfig.apiModel
  ) {
    ElMessage.warning("请填写完整的API配置");
    return;
  }

  isTestingAi.value = true;
  aiTestResult.value = null;

  try {
    const response = await fetch(props.aiConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${props.aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: props.aiConfig.apiModel,
        messages: [{ role: "user", content: '请回复"连接成功"' }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      aiTestResult.value = {
        success: true,
        message: "API连接测试成功，配置有效",
      };
    } else {
      const error = await response.json();
      aiTestResult.value = {
        success: false,
        message: `连接失败: ${error.error?.message || response.status}`,
      };
    }
  } catch (error) {
    aiTestResult.value = {
      success: false,
      message: `连接失败: ${error.message}`,
    };
  } finally {
    isTestingAi.value = false;
  }
};
</script>
