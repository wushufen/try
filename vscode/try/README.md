# auto-style README

Automatically create less/scss from your html/vue file

## Usage

1. `CMD/CTRL + P`
2. `autoStyle`

## Example
```html
<template>
  <div class="container">
    <div class="title"></div>
    <div class="content">
      <div class="list">
        <div class="item"></div>
      </div>
    </div>
  </div>
</template>
<style lang="less" scoped>
|
</style>
```
==>
```html
<template>
  <div class="container">
    <div class="title"></div>
    <div class="content">
      <div class="list">
        <div class="item"></div>
      </div>
    </div>
  </div>
</template>
<style lang="less" scoped>
.container {
  .title {
  }
  .content {
    .list {
      .item {
      }
    }
  }
}
</style>
```