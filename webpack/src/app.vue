<template>
  <div class="parent">
    <div class="child">
      <input type="text" placeholder="placeholder">
      value: {{value}}
    </div>
  </div>
</template>
<script>
export default {
  data: () => {
    return {
      value: 'hello',
    };
  },
};
</script>

<style lang="less" scoped>
.parent {
  .child {
    color: #f80;
  }
}
</style>
