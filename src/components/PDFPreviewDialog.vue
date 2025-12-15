<template>
  <el-dialog
    v-model="dialogVisible"
    :title="pdfFile?.name || 'PDF预览'"
    width="80%"
    top="2vh"
  >
    <div class="pdf-preview-container">
      <div class="flex justify-between items-center p-3 bg-gray-800">
        <div class="flex items-center gap-3">
          <el-button-group>
            <el-button
              size="small"
              @click="prevPage"
              :disabled="currentPage <= 1 || loading"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-button size="small" disabled>
              {{ currentPage }} / {{ totalPages }}
            </el-button>
            <el-button
              size="small"
              @click="nextPage"
              :disabled="currentPage >= totalPages || loading"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        <div class="flex items-center gap-2">
          <el-button size="small" @click="zoomOut" :disabled="loading">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <span class="text-white text-sm">{{ Math.round(scale * 100) }}%</span>
          <el-button size="small" @click="zoomIn" :disabled="loading">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" @click="rotate" :disabled="loading">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
          <el-button
            v-if="error"
            size="small"
            type="warning"
            @click="retryLoad"
          >
            重试
          </el-button>
        </div>
      </div>
      <div class="pdf-canvas-container" ref="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <el-icon class="loading-icon" size="48"><Loading /></el-icon>
          <p class="loading-text">正在加载PDF...</p>
        </div>
        <!-- 错误状态 -->
        <div v-else-if="error" class="error-overlay">
          <el-icon class="error-icon" size="48" color="#f56565"
            ><Warning
          /></el-icon>
          <p class="error-text">{{ error }}</p>
          <el-button type="primary" @click="retryLoad">重新加载</el-button>
        </div>
        <!-- PDF画布 -->
        <canvas
          v-show="!loading && !error"
          ref="canvas"
          :style="{ transform: `rotate(${rotation}deg)` }"
        ></canvas>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, shallowRef, watch, nextTick, computed, markRaw } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  ZoomOut,
  ZoomIn,
  RefreshRight,
  Loading,
  Warning,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import * as pdfjsLib from "pdfjs-dist";

// 导入本地Worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// 配置PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  pdfFile: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:visible"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const canvas = ref(null);
const container = ref(null);
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref(1.0);
const rotation = ref(0);
const pdfDoc = shallowRef(null);
const loading = ref(false);
const error = ref(null);

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal && props.pdfFile) {
      currentPage.value = 1;
      scale.value = 1.0;
      rotation.value = 0;
      await nextTick();
      await loadPdf();
    }
  }
);

const loadPdf = async () => {
  if (!props.pdfFile) return;

  loading.value = true;
  error.value = null;

  try {
    // 验证PDF数据
    if (!props.pdfFile.data) {
      throw new Error("PDF数据为空");
    }

    // 解码Base64数据
    let binary;
    try {
      binary = atob(props.pdfFile.data);
    } catch (e) {
      throw new Error("PDF数据格式错误，无法解码Base64");
    }

    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // 验证PDF文件头
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x25 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x44 ||
      bytes[3] !== 0x46
    ) {
      throw new Error("文件不是有效的PDF格式");
    }

    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    const pdf = await loadingTask.promise;
    pdfDoc.value = markRaw(pdf);
    totalPages.value = pdf.numPages;

    // 先结束加载状态，让canvas显示出来
    loading.value = false;
    
    // 使用setTimeout确保canvas完全渲染到DOM
    setTimeout(async () => {
      await renderPage();
      ElMessage.success("PDF加载成功");
    }, 150);
  } catch (err) {
    loading.value = false;
    const errorMsg = err.message || "PDF加载失败";
    error.value = errorMsg;
    console.error("PDF加载失败:", err);
    ElMessage.error(errorMsg);
  }
};

const renderPage = async () => {
  if (!pdfDoc.value || loading.value) {
    console.log("renderPage: 跳过 - pdfDoc或loading状态不对");
    return;
  }
  
  if (!canvas.value) {
    console.log("renderPage: canvas.value不存在，等待重试...");
    // 如果canvas不存在，延迟重试
    setTimeout(() => renderPage(), 50);
    return;
  }

  // 确保DOM已更新
  await nextTick();
  
  try {
    const page = await pdfDoc.value.getPage(currentPage.value);
    const viewport = page.getViewport({ scale: scale.value });

    const context = canvas.value.getContext("2d");
    
    // 先设置画布尺寸（在清除之前）
    canvas.value.height = viewport.height;
    canvas.value.width = viewport.width;

    // 清除画布
    context.clearRect(0, 0, canvas.value.width, canvas.value.height);

    // 渲染页面
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    console.log(`✅ 已渲染第${currentPage.value}页，缩放: ${scale.value}，尺寸: ${viewport.width}x${viewport.height}`);
  } catch (err) {
    const errorMsg = `渲染第${currentPage.value}页失败: ${err.message}`;
    console.error("渲染页面失败:", err);
    ElMessage.error(errorMsg);
  }
};

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    await renderPage();
  }
};

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    await renderPage();
  }
};

const zoomIn = async () => {
  const oldScale = scale.value;
  scale.value = Math.min(3, scale.value + 0.25);
  console.log(`🔍 zoomIn: ${oldScale} → ${scale.value}`);
  await renderPage();
};

const zoomOut = async () => {
  const oldScale = scale.value;
  scale.value = Math.max(0.5, scale.value - 0.25);
  console.log(`🔍 zoomOut: ${oldScale} → ${scale.value}`);
  await renderPage();
};

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360;
};

const retryLoad = async () => {
  await loadPdf();
};
</script>

<style scoped>
.pdf-preview-container {
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.pdf-canvas-container {
  flex: 1;
  overflow: auto;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.loading-overlay,
.error-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  text-align: center;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: #409eff;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

.error-text {
  color: #f56c6c;
  font-size: 16px;
  margin: 0;
  max-width: 400px;
  line-height: 1.5;
}

canvas {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  transition: transform 0.3s ease;
  display: block;
}
</style>
