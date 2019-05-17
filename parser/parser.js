function getTokens(string, tokenRules) {
  let str = string
  let tokenList = []
  let index = 0

  while (str) {
    let token = ''
    let type = ''
    let matchIndex = Infinity

    for (let key in tokenRules) {
      if (tokenRules.hasOwnProperty(key)) {
        let rule = tokenRules[key]
        let match = str.match(rule)
        if (match) {
          if (match.index === 0) {
            let _token = match[0]
            if (_token.length > token.length) {
              token = _token
              type = key
            }
          }
          if (match.index < matchIndex) {
            matchIndex = match.index
          }
        }
      }
    }

    if (!token) {
      token = str.substr(0, matchIndex)
      // throw 'Not match token: ' + str
    }

    // if (type !== 'space' && type !== 'comment') {
    //   console.log(`${index}\t[${type}]:   \t${token}`)
    // }

    tokenList.push({
      text: token,
      type: type,
      index: index,
    })

    index += token.length
    str = str.substr(token.length)

  }

  console.table(tokenList)
  return tokenList
}

function getReg(obj, rule) {
  for(let key in obj){
    let _rule = obj[key]
    rule = rule.replace(RegExp(`{${key}}`, 'g'), _rule.source)
  }
  return RegExp(rule)
}


var lessTokenRules = {
  space: /\s+/,
  operator: /[~!@#$%^&*\-=+<.>/?,()[\]]/,
  delimiter: /[{}:;]/,
  literal: /([^\s~!@#$%^&*()_\-=+[{}\]:;'",<.>/?]|[_$])+/,
  // "" | '' | ``
  string: /"(\\.|.)*?"|'(\\.|.)*?'|`(\\.|[^`])*?`/,
  // // | /**/
  comment: /\/\/.*|\/\*[\s\S]*?\*\//,
}
lessTokenRules.text = getReg(lessTokenRules, '({string}|[^\\s{};])+')
lessTokenRules.text = getReg(lessTokenRules, '{text}({text}|{space})*{text}')


function parseLess(string) {
  let tokenList = getTokens(string, lessTokenRules)
  let rootNode = {
    root: true,
    token: {},
    selector: '',
    propertys: [],
    children: [],
    parentNode: null,
  }
  let parentNode = rootNode
  let childNode = null

  while (tokenList.length) {
    let token = tokenList.shift()
    let tokenNext = {}
    if (tokenList[0]) {
      tokenNext = tokenList[0]
      if (tokenNext.type == 'space') {
        tokenNext = tokenList[1] || tokenNext
      }
    }

    // selector
    if (token.type === 'text' && tokenNext.text === '{') {
      childNode = {
        token: token,
        '!selector': token.text,
        propertys: [],
        children: [],
        parentNode: parentNode,
      }
      parentNode.children.push(childNode)
    }
    // property
    if (token.type === 'text' && tokenNext.text === ';') {
      //
    }
    // push
    if (token.text === '{') {
      parentNode = childNode
    }
    // pop
    if (token.text === '}') {
      childNode = parentNode
      parentNode = parentNode.parentNode || rootNode
    }
  }

  return rootNode
}


var htmlTokenRules = {
  space: /\s+/,
  operator: /[~!@#$%^&*\-=+<.>/?,()[\]]/,
  delimiter: /[{}:;]/,
  literal: /([^\s~!@#$%^&*()_\-=+[{}\]:;'",<.>/?]|[-_$])+/,
  // "" | '' | ``
  string: /"(\\.|.)*?"|'(\\.|.)*?'|`(\\.|[^`])*?`/,
  // <!-- -->
  comment: /<!--[\s\S]*?-->/,
}

htmlTokenRules.attr = getReg(htmlTokenRules, '[^\\s=<>]+(=({string}|[^\\s=<>])?)?')
htmlTokenRules.openTag = getReg(htmlTokenRules, '<{literal}({space}|{attr})*>')
htmlTokenRules.closeTag = getReg(htmlTokenRules, '</{literal}>')

var _htmlTokenRules = htmlTokenRules
htmlTokenRules = {
  openTag: _htmlTokenRules.openTag,
  closeTag: _htmlTokenRules.closeTag,
  comment: _htmlTokenRules.comment,
}

// function parseHtml(string) {
//   let tokenList = getTokens(string, htmlTokenRules)

//   return tokenList
// }

function test() {
  let rs = parseLess(`
  <template>
  <page headerText="尚德百科">
    <div class="container">
      <div class="tab-list-wrap" :class="{open:isTabsDropdownOpen}">
        <div ref="tabList" class="tab-list" :class="{center:channelList.length<6}">
          <div
            v-for="(item,i) in channelList"
            :key="i"
            class="item"
            :class="{active:current.channel==item}"
            @click="current.channel=item"
          >{{item.title}}</div>
        </div>
        <div class="toggle" @click="isTabsDropdownOpen=!isTabsDropdownOpen">
          <div class="icon-down"></div>
        </div>
        <transition>
          <div v-if="isTabsDropdownOpen" class="dropdown" @click.self="isTabsDropdownOpen=false">
            <div class="dropdown-list">
              <div
                v-for="(item,i) in channelList"
                :key="i"
                class="item"
                :class="{active:current.channel==item}"
                @click="current.channel=item"
              >{{item.title}}</div>
            </div>
          </div>
        </transition>
      </div>
      <swiper ref="swiper" class="tab-content-list" @slideChange="slideChange">
        <swiper-slide v-for="channel in channelList" :key="channel" class="tab-content">
          <mescroll-vue ref="mescroll" :down="mescrollVueOptions.down" :up="mescrollVueOptions.up">
            <!-- banner -->
            <swiper v-if="channel.bannerList.length" class="banner" :options="swiperOptions">
              <swiper-slide v-for="item in channel.bannerList" class="item" :key="item">
                <img
                  :src="item.imageUrl"
                  alt=""
                  class="img"
                  @click="clickItem(item,11,item.bannerId,111,207)"
                >
                <div class="title">{{item.title}}</div>
              </swiper-slide>
              <div class="swiper-pagination" slot="pagination"></div>
            </swiper>
            <!-- list -->
            <div class="article-list" is="transition-group" name="list">
              <!-- topList -->
              <div
                v-for="item in channel.topList"
                :key="item"
                xis="router-link"
                class="item"
                :class="{visited:item.visited}"
                to="/articel"
                @click.prevent="clickItem(item,12,item.contentId,121,208)"
              >
                <div class="left">
                  <div class="title">{{item.title}}</div>
                  <div class="footer">
                    <div class="tag">置顶</div>
                    <div class="views">{{item.viewCount}}人查看</div>
                  </div>
                </div>
                <!-- <div class="right">
                  <div class="img"></div>
                </div>-->
              </div>
              <!-- notTopList -->
              <div
                v-for="item in channel.notTopList"
                :key="item"
                xis="router-link"
                class="item"
                :class="{visited:item.visited}"
                to="/articel"
                @click.prevent="clickItem(item,12,item.contentId,121,208)"
              >
                <div class="left">
                  <div class="title">{{item.title}}</div>
                  <div class="footer">
                    <!-- <div class="tag">置顶</div> -->
                    <div class="views">{{item.viewCount}}人查看</div>
                  </div>
                </div>
                <div v-if="item.imageUrl" class="right">
                  <img :src="item.imageUrl" alt="" class="img">
                </div>
              </div>
              <!-- <div v-if="channel.isNoMore" :key="no-more" class="no-more">没有数据了</div> -->
            </div>
          </mescroll-vue>
        </swiper-slide>
      </swiper>
    </div>
  </page>
</template>
<script>
import MescrollVue from 'mescroll.js/mescroll.vue'
import utils from '@/helper/util'

export default {
  components: {
    MescrollVue
  },
  data () {
    return {
      swiperOptions: {
        autoplay: {
          delay: 2000,
        },
        pagination: {
          el: '.swiper-pagination'
        }
      },
      mescrollVueOptions: {
        down: {
          auto: false,
          callback: () => {
            this.refresh(this.current.channel)
          }
        },
        up: {
          auto: false,
          offset: 500,
          htmlNodata: '<p class="upwarp-nodata">没有更多了</p>',
          inited: (mescroll) => {
            // fix mescroll.__proto_.showNoMore
            mescroll.showNoMore = function () {
              this.upwarp.style.visibility = 'visible'
              this.upwarp.style.display = 'block'
              // this.optUp.hasNext = false
              this.optUp.showNoMore(this, this.upwarp)
            }
          },
          onScroll: (m, y, isUp) => {
            this.current.channel.scrollTop = y
          },
          callback: () => {
            this.loadChannelData(this.current.channel)
          }
        }
      },
      channelList: [
        // Object.assign(channel, {
        //   index,
        //   bannerList: [],
        //   topList: [],
        //   notTopList: [],
        //   pageNo: 1,
        //   pageSize: 10,
        //   isNoMore: false,
        //   scrollTop: 0,
        // })
      ],
      current: {
        channel: { },
        item: {},
      },
      isTabsDropdownOpen: false,
      isFirstIn: true,
    }
  },
  watch: {
    // tab 切换
    'current.channel' (channel) {
      this.analysisEventByObject('Lite_category', ['id', channel.id, 'name', channel.title])

      // vue 的下一帧。
      // 为什么要下一帧： 因为要vue要更新视图后才能准确拿dom节点的信息
      this.$nextTick(() => {
        let tabListEl = this.$refs.tabList
        let currentEl = tabListEl.children[channel.index]

        // 计算当前 tab 置中的话，父节点 需要设置的 offsetLeft
        let scrollLeft = tabListEl.scrollLeft
        let endScrollLeft = currentEl.offsetLeft - tabListEl.clientWidth / 2 + currentEl.clientWidth / 2

        // 非第一次进来，切换 tab 使用动画
        if (!this.isFirstIn) {
          this.$refs['swiper'].swiper.slideTo(channel.index, 888)

          // tabListEl.scrollLeft 进行补间滚动，而不是突兀的显示
          this.tween(scrollLeft, endScrollLeft).update(value => {
            tabListEl.scrollLeft = value
          })
        } else {
          // 第一次进来不应该使用动画，直接显示
          this.$refs['swiper'].swiper.slideTo(channel.index, 0)
          tabListEl.scrollLeft = endScrollLeft
          this.isFirstIn = false
        }
      })
    }
  },
  methods: {
    /**
     * 补间函数
     * start{Nubmer}: 开始值
     * end{Number}: 结束值
     * callback(value): 过程回调
     *   value{Number}: 补间过程 start 到 end 间当前的值
     * return{Object}
     *   update(callback): 链式设置 callback
     */
    tween (start, end, callback) {
      let timeout = 250
      let timeGap = 16
      let times = timeout / timeGap
      let diff = end - start
      let step = diff / times
      let timer = setInterval(() => {
        start += step
        if ((step >= 0 && start >= end) || (step <= 0 && start <= end)) {
          start = end
          clearInterval(timer)
        }
        callback(start)
      }, timeGap)
      return {
        update (fn) {
          callback = fn
        }
      }
    },
    async load () {
      await this.loadChannelList()
      this.slideChange()
    },
    async loadChannelList () {
      let {resultList: channelList} = await this.post('/speed/c/channel/getList')
      this.channelList = channelList.map((channel, index) => {
        // 把 channel 和 相关信息 直接关联，可以减少很多查找代码
        return Object.assign(channel, {
          index,
          bannerList: [],
          topList: [],
          notTopList: [],
          pageNo: 1,
          pageSize: 10,
          isNoMore: false,
          scrollTop: 0,
        })
      })
    },
    async loadChannelData (channel) {
      let mescroll = this.$refs.mescroll[channel.index].mescroll
      // channel.isNoMore = false

      // loading
      if (channel.pageNo === 1) {
        mescroll.showDownScroll()
      }
      // lock
      mescroll.lockUpScroll()
      mescroll.lockDownScroll()

      // 并行请求
      let bannerResult = {}
      let topListResult = {}
      let notTopListResult = {}
      Promise.all([
        // banner
        (async function () {
          if (channel.pageNo === 1 && channel.index === 0) {
            bannerResult = await this.post('/speed/c/channel/getBannerList', {channelId: channel.id})
          }
        }.call(this)),
        // topList
        (async function () {
          if (channel.pageNo === 1) {
            topListResult = await this.post('/speed/c/channel/getTopContentList', {channelId: channel.id})
          }
        }.call(this)),
        // notTopList
        (async function () {
          notTopListResult = await this.post('/speed/c/channel/getNotTopContentList', {
            channelId: channel.id,
            pageNo: channel.pageNo,
            pageSize: channel.pageSize,
          })
        }.call(this))
      ]).finally(() => {
        let bannerList = bannerResult.resultList || []
        let topList = topListResult.resultList || []
        let notTopList = notTopListResult.resultList || []

        if (bannerResult.resultList) {
          channel.bannerList = bannerList
        }
        if (topListResult.resultList) {
          channel.topList = topList
        }

        notTopList = notTopListResult.resultList
        if (channel.pageNo === 1) {
          channel.notTopList = notTopList
        } else {
          if (channel.notTopList.length >= notTopListResult.total) {
            notTopList = []
          }
          channel.notTopList.push(...notTopList)
        }

        // unlock
        mescroll.endSuccess()
        mescroll.hideUpScroll()
        setTimeout(() => {
          mescroll.lockUpScroll(false)
          mescroll.lockDownScroll(false)
        }, 500)

        // no more
        if (!topList.length && !notTopList.length) {
          mescroll.showNoMore() // 有 bug // 已 fix
          channel.isNoMore = true
        } else {
          channel.isNoMore = false
          channel.pageNo += 1
        }
      })
    },
    async refresh (channel) {
      channel.pageNo = 1
      this.loadChannelData(channel)
    },
    async slideChange () {
      this.$nextTick(() => {
        let index = this.$refs['swiper'].swiper.activeIndex
        let channel = this.channelList[index]

        // 第一页自动拿数据
        if (channel.pageNo === 1) {
          this.loadChannelData(channel)
        }

        this.current.channel = channel
      })
    },
    // 案发现场
    storeData () {
      utils.setStorage('index:channelList', (this.channelList))
      utils.setStorage('index:current.channel.index', (this.current.channel.index))
      utils.setStorage('index:storeTime', new Date())
    },
    clickItem (item, targetType, targetId, page, sourceType) {
      // #back 标记跳转
      // this.$router.replace('#back')
      this.$router.replace(this.$route.fullPath.replace(/(#[^#]*?)?$/, '#back'))

      item.visited = true
      this.current.item = item
      // 查看人数 +每次点击{6,7,8,9,10 }
      // this.current.item.viewCount += parseInt(Math.random() * (11 - 6) + 6)

      // 统计打点。相关或类似的东西放一起，换行分隔
      this.log_click({ click_element: '列表项', label: item.title })
      this.dot(targetType, targetId, page)

      // 统一在跳转前保存数据
      this.storeData()
      location.href = this.getArticlePath({
        idAlias: item.articleIdAlias,
        enterSource: sourceType
      })
    }
  },
  async mounted () {
    // window.vue = this
    this.log_browse()

    // 还原现场
    if (this.$route.hash === '#back') {
      // this.$router.replace('#backed'))
      this.$router.replace(this.$route.fullPath.replace(/#back$/, ''))

      // 还原数据
      this.channelList = utils.getStorage('index:channelList')
      let channelIndex = utils.getStorage('index:current.channel.index')
      this.current.channel = this.channelList[channelIndex]

      // 还原所有tab下的列表的滚动条
      this.$nextTick(() => {
        this.$refs['mescroll'].forEach((mescroll, index) => {
          mescroll.$el.scrollTop = this.channelList[index].scrollTop
        })
      })
    } else {
      this.load()
    }
  }
}
</script>
<style lang="less" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  .tab-list-wrap {
    flex: none;
    .tab-list {
      position: relative;
      z-index: 2;
      display: flex;
      height: 40px;
      padding: 0 20 - 25/2px;
      overflow: auto;
      background: #fff;
      &:after {
        content: "";
        flex: none;
        width: 59px;
        height: 1px;
      }
      &.center {
        &:before,
        &:after {
          content: "";
          width: auto;
          margin: auto;
        }
        + .toggle {
          display: none;
        }
      }
      .item {
        position: relative;
        padding: 0 25/2px;
        line-height: 40px;
        font-family: PingFangSC-Regular;
        font-size: 16px;
        color: #666666;
        letter-spacing: 0;
        text-align: center;
        white-space: nowrap;
        &.active {
          font-family: PingFangSC-Semibold;
          font-size: 16px;
          color: #030303;
          letter-spacing: 0;
          text-align: center;
          &:after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            // bottom: 7px;
            bottom: 0;
            margin: auto;
            width: 14px;
            height: 2px;
            background: #000000;
            border-radius: 1px;
          }
        }
      }
    }
    .toggle {
      position: absolute;
      z-index: 3;
      right: 0;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      width: 59px;
      opacity: 0.98;
      background-image: linear-gradient(
        -90deg,
        #ffffff 0%,
        #ffffff 84%,
        rgba(255, 255, 255, 0) 100%
      );
      .icon-down {
        transition: 0.3s;
      }
    }
    .dropdown {
      // display: none;
      position: absolute;
      z-index: 9999;
      left: 0;
      right: 0;
      top: 40px;
      bottom: 0;
      background: rgba(0, 0, 0, 0.2);
      .dropdown-list {
        display: flex;
        flex-wrap: wrap;
        // justify-content: center;
        justify-content: flex-start;
        // align-content: flex-start;
        // height: 110px;
        max-height: 250px;
        padding: 10 - 12/2px 0;
        padding-left: 16 - 12/2px;
        overflow: auto;
        background: #ffffff;
        box-shadow: 5px 5px 5px -3px #aaa;
        .item {
          margin: 12/2px;
          width: 77px;
          padding: 0 4px;
          // height: 32px;
          line-height: 32px;
          background: #f0f0f0;
          border-radius: 2px;
          text-align: center;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-family: PingFangSC-Regular;
          font-size: 13px;
          color: #000000;
          letter-spacing: 0;
          text-align: center;
          &.active {
            color: #4b97fd;
          }
        }
      }
    }
    &.open {
      .toggle {
        .icon-down {
          transform: rotate(180deg);
        }
      }
      .dropdown {
        display: block;
      }
      + .tab-content-list {
        .tab-content {
          // -webkit-overflow-scrolling: auto;
          // overflow: hidden;
        }
        filter: blur(2px);
        margin-top: -0.1px;
      }
    }
  }
  .tab-content-list {
    width: 100%;
    height: 100%;
    .tab-content {
      overflow: auto;
      .banner {
        width: 343px;
        margin-left: auto;
        margin-right: auto;
        margin-top: 5px;
        border-radius: 6px;
        .item {
          position: relative;
          width: 100%;
          height: 150px;
          .img {
            display: block;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            object-fit: cover;
          }
          .title {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 52px;
            line-height: 52px;
            padding: 0 12px;
            background-image: linear-gradient(
              -180deg,
              rgba(1, 1, 1, 0) 0%,
              rgba(1, 1, 1, 0.85) 97%
            );
            border-radius: 0px 0px 6px 6px;
            font-family: PingFangSC-Semibold;
            font-size: 16px;
            color: #ffffff;
            // text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
      .article-list {
        .item {
          display: flex;
          padding: 12px 0;
          margin: 0 18px;
          color: #000000;
          border-bottom: 1px solid #f0f0f0;
          // &:visited,
          &.visited {
            color: #999999;
          }
          .left {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            .title {
              max-height: 50px;
              font-family: PingFangSC-Regular;
              font-size: 17px;
              letter-spacing: 0;
              line-height: 26px;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
            }
            .footer {
              display: flex;
              margin-top: 7px;
              .tag {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 6px;
                width: 30px;
                height: 16px;
                font-size: 12px;
                color: #4b97fd;
                border: 1px solid #4b97fd;
                border-radius: 2px;
              }
              .views {
                font-family: PingFangSC-Regular;
                font-size: 12px;
                color: #999999;
                letter-spacing: 0;
              }
            }
          }
          .right {
            flex: 0;
            .img {
              margin-left: 13px;
              width: 117px;
              height: 72px;
              background: #eee;
              object-fit: cover;
            }
          }
        }
      }
      .no-more {
        text-align: center;
        line-height: 74px;
        margin-bottom: -74px;
        color: #aaa;
      }
    }
  }
}
</style>

`)
  return rs
}
test()


var htmlRules = {
  text: /([^<]|<\s)+/,
  comment: /<!--[\s\S]*?-->/,
  openTag: {
    start: '<',
    tagName: /^[^\s</>]+/,
    attribute: {
      start: /\s+/,
      name: /[^\s</>]+/,
      eq: '=',
      value: /[^\s</>]+|"(\\.|.)*?"|'(\\.|.)*?'/,
    },
    end: '>',
  },
  closeTag: {
    start: '</',
    tagName: /[^</>]+/,
    end: '>',
  }
}

function parseHtml(string) {
  var dom = {
    className: '',
    children: [],
  }

  for(let key in htmlRules){
    let rule = htmlRules[key]
  }
}
