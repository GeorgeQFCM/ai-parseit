<template>
  <div>
    <h2 class="section-title">订单合同上传</h2>

    <!-- PDF Upload Zone -->
    <div
      class="upload-zone"
      :class="{ dragover: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <el-icon :size="48" color="#9ca3af"><FolderAdd /></el-icon>
      <p class="text-lg font-medium text-gray-600 mt-4">
        拖拽PDF合同文件到此处
      </p>
      <p class="text-sm text-gray-400 mt-2">支持多文件上传，单文件最大 20MB</p>
      <el-button type="primary" class="mt-4" @click="triggerUpload">
        <el-icon><FolderOpened /></el-icon> 选择文件
      </el-button>
      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <!-- Contract List -->
    <div v-if="contractFiles.length > 0" class="mt-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="section-title mb-0">
          已上传合同 ({{ contractFiles.length }})
        </h3>
        <div class="flex gap-2">
          <el-button
            type="success"
            @click="extractAllContracts"
            :loading="isExtractingAll"
          >
            <el-icon><MagicStick /></el-icon> AI批量提取
          </el-button>
          <el-button type="danger" plain @click="$emit('clear-all')">
            <el-icon><Delete /></el-icon> 清除全部
          </el-button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="(contract, idx) in contractFiles"
          :key="idx"
          class="contract-card"
        >
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3 flex-1">
              <div
                class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <el-icon :size="20" color="white"><Document /></el-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 truncate">
                  {{ contract.name }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatFileSize(contract.size) }}
                </p>
              </div>
            </div>
            <div class="flex gap-1">
              <el-button
                type="primary"
                size="small"
                circle
                @click="$emit('preview-pdf', contract)"
              >
                查看
              </el-button>
              <el-button
                type="success"
                size="small"
                circle
                @click="extractContract(contract)"
                :loading="contract.extracting"
              >
                提取
              </el-button>
              <el-button
                type="danger"
                size="small"
                circle
                @click="$emit('remove-contract', idx)"
              >
                <el-icon :size="14"><Close /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- Extraction Status -->
          <div v-if="contract.extracted" class="mt-3 pt-3 border-t">
            <div class="flex items-center gap-2 text-green-600 text-sm">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>已提取 · 订单号: {{ contract.orderNo || "未识别" }}</span>
            </div>
            <div
              v-if="contract.products && contract.products.length"
              class="mt-2"
            >
              <el-tag
                v-for="(p, pi) in contract.products.slice(0, 3)"
                :key="pi"
                class="mr-1 mb-1"
              >
                {{ p.name }} - ¥{{ p.unitPrice }}
              </el-tag>
              <el-tag
                v-if="contract.products.length > 3"
                size="small"
                type="info"
              >
                +{{ contract.products.length - 3 }} 更多
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Extracted Data Table -->
    <div v-if="allExtractedProducts.length > 0" class="mt-6">
      <h3 class="section-title">提取结果汇总</h3>
      <el-table
        :data="allExtractedProducts"
        border
        stripe
        max-height="400"
        style="width: 100%"
      >
        <el-table-column
          prop="contractName"
          label="合同文件"
          width="250"
          show-overflow-tooltip
        />
        <el-table-column prop="orderNo" label="订单编号" width="150" />
        <el-table-column prop="name" label="产品名称" width="150" />
        <el-table-column prop="color" label="颜色" width="100" />
        <el-table-column prop="package" label="包装" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="unitPrice" label="单价" width="100">
          <template #default="scope">
            <span class="text-green-600 font-semibold"
              >¥{{ scope.row.unitPrice }}</span
            >
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              link
              @click="
                $emit('edit-product', {
                  product: scope.row,
                  index: scope.$index,
                })
              "
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  FolderAdd,
  FolderOpened,
  MagicStick,
  Delete,
  Document,
  Close,
  CircleCheckFilled,
} from "@element-plus/icons-vue";
import * as pdfjsLib from "pdfjs-dist";

const props = defineProps({
  contractFiles: {
    type: Array,
    required: true,
  },
  aiConfig: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  "extract-contract",
  "extract-all",
  "remove-contract",
  "clear-all",
  "preview-pdf",
  "edit-product",
  "switch-to-ai-config",
]);

const fileInput = ref(null);
const isDragging = ref(false);
const isExtractingAll = ref(false);

const allExtractedProducts = computed(() => {
  const products = [];
  props.contractFiles.forEach((contract) => {
    if (contract.products && contract.products.length) {
      contract.products.forEach((p) => {
        products.push({
          ...p,
          contractName: contract.name,
          orderNo: contract.orderNo,
        });
      });
    }
  });
  return products;
});

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const triggerUpload = () => {
  fileInput.value.click();
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  files.forEach(processFile);
  e.target.value = "";
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files);
  files.forEach(processFile);
};

const processFile = async (file) => {
  if (file.type !== "application/pdf") {
    ElMessage.error(`${file.name} 不是PDF文件`);
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error(`${file.name} 超过20MB限制`);
    return;
  }

  if (props.contractFiles.some((c) => c.name === file.name)) {
    ElMessage.warning(`${file.name} 已存在`);
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  props.contractFiles.push({
    name: file.name,
    size: file.size,
    data: base64,
    uploadTime: new Date().toLocaleString(),
    extracted: false,
    extracting: false,
    orderNo: null,
    products: [],
  });

  ElMessage.success(`${file.name} 上传成功`);
};

const extractContract = async (contract) => {
  if (
    !props.aiConfig.apiUrl ||
    !props.aiConfig.apiKey ||
    !props.aiConfig.apiModel
  ) {
    ElMessage.warning("请先配置AI连接信息");
    emit("switch-to-ai-config");
    return;
  }

  contract.extracting = true;

  try {
    const pdfText = await extractPdfText(contract);
    const result = await callAiApi(pdfText);

    if (result) {
      contract.orderNo = result.orderNo;
      contract.products = result.products || [];
      contract.extracted = true;
      ElMessage.success(`${contract.name} 提取成功`);
    }
  } catch (error) {
    console.error("提取失败:", error);
    ElMessage.error("提取失败: " + error.message);
  } finally {
    contract.extracting = false;
  }
};

const extractPdfText = async (contract) => {
  const binary = atob(contract.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }

  return text;
};

const defaultPrompt = `你是一个专业的合同信息提取助手。请从以下合同内容中提取信息，并以JSON格式返回。

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
- 仅返回JSON，不要其他说明

示例输出格式：
{
  "orderNo": "PO-2024-001",
  "products": [
    {"name": "产品A", "color": "红色", "package": "中文包装", "quantity": 500, "unit": "个", "unitPrice": 15000.00}
  ]
}

合同内容：`;

const callAiApi = async (pdfText, retryCount = 0) => {
  const prompt = (props.aiConfig.prompt || defaultPrompt) + "\n\n" + pdfText;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      props.aiConfig.timeout * 1000
    );

    const response = await fetch(props.aiConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${props.aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: props.aiConfig.apiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || data.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("未能解析AI返回的JSON数据");
  } catch (error) {
    if (retryCount < props.aiConfig.retryCount) {
      console.log(`重试第 ${retryCount + 1} 次...`);
      await new Promise((r) => setTimeout(r, 1000));
      return callAiApi(pdfText, retryCount + 1);
    }
    throw error;
  }
};

const extractAllContracts = async () => {
  const unextracted = props.contractFiles.filter((c) => !c.extracted);
  if (unextracted.length === 0) {
    ElMessage.info("所有合同已提取完成");
    return;
  }

  if (!props.aiConfig.apiUrl || !props.aiConfig.apiKey) {
    ElMessage.warning("请先配置AI连接信息");
    emit("switch-to-ai-config");
    return;
  }

  isExtractingAll.value = true;

  for (const contract of unextracted) {
    await extractContract(contract);
    await new Promise((r) => setTimeout(r, 500));
  }

  isExtractingAll.value = false;
  ElMessage.success("批量提取完成");
};
</script>
