<template>
  <div class="wrapper">
    <h1 class="full-width">New Zealand Top 40</h1>
    <div class="flex">
      <Card
        v-for="(song, index) in songs"
        :song="song"
        :key="song.recordNumber"
      ></Card>
    </div>
  </div>
</template>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap");
body {
  font-family: Outfit;
}
.flex {
  display: flex;
  padding: 20px;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 18px;
  justify-content: center;
  margin-bottom: 20px;
}
h1 {
  margin-top: 35px;
  text-align: center;
}
body {
  background-color: #fffaf0;
}
</style>

<script setup>
import { songs } from "/data/latest.js";
</script>
