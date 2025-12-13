<template>
  <el-dialog v-model="dialogVisible" title="编辑产品信息" width="500px">
    <el-form :model="formData" label-width="100px" v-if="formData">
      <el-form-item label="产品名称">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="颜色">
        <el-input v-model="formData.color" />
      </el-form-item>
      <el-form-item label="包装">
        <el-input v-model="formData.package" />
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number v-model="formData.quantity" :min="0" />
      </el-form-item>
      <el-form-item label="单位">
        <el-input v-model="formData.unit" />
      </el-form-item>
      <el-form-item label="单价">
        <el-input-number v-model="formData.unitPrice" :precision="2" :min="0" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input type="textarea" rows="4" v-model="formData.remark" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  product: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:visible", "save"]);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const formData = ref(null);

watch(
  () => props.product,
  (newProduct) => {
    if (newProduct) {
      formData.value = { ...newProduct };
    }
  },
  { immediate: true }
);

const saveEdit = () => {
  emit("save", formData.value);
  dialogVisible.value = false;
};
</script>
