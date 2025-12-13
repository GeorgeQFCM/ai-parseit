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
              :disabled="currentPage <= 1"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-button size="small" disabled>
              {{ currentPage }} / {{ totalPages }}
            </el-button>
            <el-button
              size="small"
              @click="nextPage"
              :disabled="currentPage >= totalPages"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        <div class="flex items-center gap-2">
          <el-button size="small" @click="zoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <span class="text-white text-sm">{{ Math.round(scale * 100) }}%</span>
          <el-button size="small" @click="zoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" @click="rotate">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="pdf-canvas-container" ref="container">
        <canvas
          ref="canvas"
          :style="{ transform: `rotate(${rotation}deg)` }"
        ></canvas>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  ZoomOut,
  ZoomIn,
  RefreshRight,
} from "@element-plus/icons-vue";
import * as pdfjsLib from "pdfjs-dist";

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
const pdfDoc = ref(null);

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

  try {
    const binary = atob(props.pdfFile.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    pdfDoc.value = pdf;
    totalPages.value = pdf.numPages;
    await renderPage();
  } catch (error) {
    console.error("PDF加载失败:", error);
  }
};

const renderPage = async () => {
  if (!pdfDoc.value || !canvas.value) return;

  try {
    const page = await pdfDoc.value.getPage(currentPage.value);
    const viewport = page.getViewport({ scale: scale.value });

    const context = canvas.value.getContext("2d");
    canvas.value.height = viewport.height;
    canvas.value.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
  } catch (error) {
    console.error("渲染页面失败:", error);
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    renderPage();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    renderPage();
  }
};

const zoomIn = () => {
  scale.value = Math.min(3, scale.value + 0.25);
  renderPage();
};

const zoomOut = () => {
  scale.value = Math.max(0.5, scale.value - 0.25);
  renderPage();
};

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360;
};
</script>
