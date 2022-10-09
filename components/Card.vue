<template>
  <div class="card">
    <img :src="song.cover" :alt="song.title" />
    <div class="rank">{{ rank }}</div>
    <p class="title">{{ song.title.toLowerCase() }}</p>
    <p class="artist">{{ song.artist }}</p>
  </div>
</template>

<script setup>
const props = defineProps(["song", "rank"]);
</script>

<style lang="scss">
.card {
  flex-basis: 200px;
  flex-grow: 0;
  flex-shrink: 0;
  border-radius: 8px;
  box-shadow: 0 2px 3px #ccc;
  padding: 10px;
  box-sizing: border-box;
  font-family: Outfit;
  cursor: pointer;
  position: relative;
  background: #ffe4c4;
  .rank {
    position: absolute;
    top: 0;
    left: 0;
    background-color: #ffffffeb;
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
  }
  &:hover {
    background-color: #ffedd6;
    box-shadow: 0 1px 6px #a7a7a7;
    .rank {
      opacity: 0.25;
    }
  }
  img {
    border-radius: 6px;
  }
  .title {
    font-size: 16px;
    text-transform: capitalize;
    margin-bottom: 0;
  }
  .artist {
    margin-top: 8px;
    font-size: 14px;
    color: #667;
  }
}
</style>
