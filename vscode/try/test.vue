<template>
  <div class="container">
    <div class="header">
      <h1></h1>
    </div>
    <ul class="list">
      <li v-for="item in list" :key="item">
        <a href="">
          <div class="user">
            <img class="avatar">
            <div class="username">wsf</div>
          </div>
        </a>
      </li>
    </ul>
    <div class="footer"></div>
  </div>
</template>
<style lang="less" scoped>
.container{
  .header{
    height: 50px;
    h1{}
  }
  ul.list{
    >li{
      .user{
        .avatar{}
        .username{
          color: #0af;
        }
      }
    }
  }
  .footer{}
}
</style>