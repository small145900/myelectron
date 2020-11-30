<template>
  <div>
    <p>版本：{{ version }} </p>
    <p style="margin-top: 40px">{{ content }}</p>
    <p style="margin-top: 40px">进度：{{ progress }}</p>
  </div>
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';
import { defineComponent, reactive, toRefs } from '@vue/composition-api';

export default defineComponent({
  name: 'PageIndex',
  setup() {
    const state = reactive({
      content: '',
      progress: '',
      version: ''
    });

    // ipcRenderer.removeAllListeners()
    ipcRenderer.on('version', (event, text: string) => {
      state.version = text;
    })

    ipcRenderer.on('message', (event, text: string) => {
        state.content = text;
    });
    //注意：“downloadProgress”事件可能存在无法触发的问题，那是因为下载速度很快，就会跳过“downloadProgress”事件,只需要限制一下下载网速就好了
    ipcRenderer.on('downloadProgress', (event, progressObj) => {
      state.progress = JSON.stringify(progressObj);
    });

    ipcRenderer.on('isUpdateNow', () => {
      state.content = '即将退出更新';
      ipcRenderer.send('isUpdateNow');
    });
    
    return { ...toRefs(state) };
  }
});
</script>
