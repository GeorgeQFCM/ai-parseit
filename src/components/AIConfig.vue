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
import { ref } from "vue";
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
