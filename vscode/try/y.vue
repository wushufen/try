<template>
  <div class="container">
    <div class="topbar"></div>
    <div class="main">
      <div class="left"></div>
      <div class="center">
        <div class="list">
          <div class="item">
            <x></x>
          </div>
        </div>
      </div>
      <div class="middle">
        <div class="list">
          <div class="item">
            <x></x>
          </div>
        </div>
      </div>
      <div class="right">
        <x>
          <x></x>
        </x>
      </div>
    </div>
    <div class="footer"></div>
  </div>
</template>
<style lang="scss" scoped>
.container {
  .topbar {
  }
  .main {
    .left {
    }
    .center,
    .middle {
      .list {
        .item {
          x{}
        }
      }
    }
    .right {
    }
  }
  .footer {
  }
}
</style>
<style lang="stylus" scoped>
.container
  .main
    .list
      .item
        width 1px
        height 2px
        .top
          width 1px
          height 10px
</style>
