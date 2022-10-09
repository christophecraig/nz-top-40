<template>
  <div class="wrapper">
    <h1 class="full-width">New Zealand Top 40</h1>
    <div class="flex">
      <Card
        v-for="(song, index) in data"
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
const data = [
  {
    recordNumber: "1",
    title: "UNHOLY",
    artist: "Sam Smith And Kim Petras",
    cover: "./data/images/cover_0_1663965857.jpg",
  },
  {
    recordNumber: "2",
    title: "UNDER THE INFLUENCE",
    artist: "Chris Brown",
    cover: "./data/images/cover_0_1660872949.jpg",
  },
  {
    recordNumber: "3",
    title: "SUPER FREAKY GIRL",
    artist: "Nicki Minaj",
    cover: "./data/images/cover_25_1660785693.jpg",
  },
  {
    recordNumber: "4",
    title: "I'M GOOD (BLUE)",
    artist: "David Guetta And Bebe Rexha",
    cover: "./data/images/cover_10_1662000846.jpg",
  },
  {
    recordNumber: "5",
    title: "I AIN'T WORRIED",
    artist: "OneRepublic",
    cover: "./data/images/cover_9_1653007613.jpg",
  },
  {
    recordNumber: "6",
    title: "CUFF IT",
    artist: "Beyonce",
    cover: "./data/images/cover_10_1659566329.jpg",
  },
  {
    recordNumber: "7",
    title: "DOJA",
    artist: "Central Cee",
    cover: "./data/images/cover_9_1658962912.jpg",
  },
  {
    recordNumber: "8",
    title: "BAD HABIT",
    artist: "Steve Lacy",
    cover: "./data/images/cover_1_1657157286.jpg",
  },
  {
    recordNumber: "9",
    title: "B.O.T.A. (BADDEST OF THEM ALL)",
    artist: "Eliza Rose And Interplanetary Criminal",
    cover: "./data/images/cover_0_1660785693.jpg",
  },
  {
    recordNumber: "10",
    title: "AS IT WAS",
    artist: "Harry Styles",
    cover: "./data/images/cover_1_1649296712.jpg",
  },
  {
    recordNumber: "11",
    title: "BIG CITY LIFE",
    artist: "Luude And Mattafix",
    cover: "./data/images/cover_0_1655502615.jpg",
  },
  {
    recordNumber: "12",
    title: "EVERGREEN (YOU DIDN'T DESERVE ME AT ALL)",
    artist: "Omar Apollo",
    cover: "./data/images/cover_6_1663203663.jpg",
  },
  {
    recordNumber: "13",
    title: "HEAT WAVES",
    artist: "Glass Animals",
    cover: "./data/images/cover_0_1612507900.jpg",
  },
  {
    recordNumber: "14",
    title: "COLD HEART (PNAU REMIX)",
    artist: "Elton John And Dua Lipa",
    cover: "./data/images/cover_2_1629343631.jpg",
  },
  {
    recordNumber: "15",
    title: "GANGSTA'S PARADISE",
    artist: "Coolio feat. LV",
    cover: "./data/images/cover_11_1665016991.jpg",
  },
  {
    recordNumber: "16",
    title: "LAST LAST",
    artist: "Burna Boy",
    cover: "./data/images/cover_14_1653007613.jpg",
  },
  {
    recordNumber: "17",
    title: "VEGAS",
    artist: "Doja Cat",
    cover: "./data/images/cover_34_1652307978.jpg",
  },
  {
    recordNumber: "18",
    title: "GO (GODDARD. REMIX)",
    artist: "Cat Burns",
    cover: "./data/images/cover_6_1648688496.jpg",
  },
  {
    recordNumber: "19",
    title: "SUNROOF",
    artist: "Nicky Youre And dazy",
    cover: "./data/images/cover_4_1656025971.jpg",
  },
  {
    recordNumber: "20",
    title: "I LIKE YOU (A HAPPIER SONG)",
    artist: "Post Malone And Doja Cat",
    cover: "./data/images/cover_3_1654738000.jpg",
  },
  {
    recordNumber: "21",
    title: "ABOUT DAMN TIME",
    artist: "Lizzo",
    cover: "./data/images/cover_0_1650504543.jpg",
  },
  {
    recordNumber: "22",
    title: "BEFORE YOU LEAVE",
    artist: "Six60",
    cover: "./data/images/cover_2_1661380817.jpg",
  },
  {
    recordNumber: "23",
    title: "ROMANTIC HOMICIDE",
    artist: "d4vd",
    cover: "./data/images/cover_1_1663888964.jpg",
  },
  {
    recordNumber: "24",
    title: "GLIMPSE OF US",
    artist: "Joji",
    cover: "./data/images/cover_13_1655343256.jpg",
  },
  {
    recordNumber: "25",
    title: "SHIVERS",
    artist: "Ed Sheeran",
    cover: "./data/images/cover_0_1631751037.jpg",
  },
  {
    recordNumber: "26",
    title: "DREAMS",
    artist: "Fleetwood Mac",
    cover: "./data/images/cover_0_1602539083.jpg",
  },
  {
    recordNumber: "27",
    title: "WAIT FOR U",
    artist: "Future feat. Drake And Tems",
    cover: "./data/images/cover_6_1651704933.jpg",
  },
  {
    recordNumber: "28",
    title: "NO ROLE MODELZ",
    artist: "J. Cole",
    cover: "./data/images/cover_12_1648160774.jpg",
  },
  {
    recordNumber: "29",
    title: "HOLD ME CLOSER",
    artist: "Elton John And Britney Spears",
    cover: "./data/images/cover_8_1662000846.jpg",
  },
  {
    recordNumber: "30",
    title: "FORGET ME",
    artist: "Lewis Capaldi",
    cover: "./data/images/cover_7_1663203663.jpg",
  },
  {
    recordNumber: "31",
    title: "SNAP",
    artist: "Rosa Linn",
    cover: "./data/images/cover_0_1658365536.jpg",
  },
  {
    recordNumber: "32",
    title: "BAD HABITS",
    artist: "Ed Sheeran",
    cover: "./data/images/cover_3_1625094334.jpg",
  },
  {
    recordNumber: "33",
    title: "2 BE LOVED (AM I READY)",
    artist: "Lizzo",
    cover: "./data/images/cover_0_1658364778.jpg",
  },
  {
    recordNumber: "34",
    title: "ANOTHER LOVE",
    artist: "Tom Odell",
    cover: "./data/images/cover_0_1662099180.jpg",
  },
  {
    recordNumber: "35",
    title: "SWEATER WEATHER",
    artist: "The Neighbourhood",
    cover: "./data/images/cover_0_1660271268.jpg",
  },
  {
    recordNumber: "36",
    title: "FIRST CLASS",
    artist: "Jack Harlow",
    cover: "./data/images/cover_11_1649888698.jpg",
  },
  {
    recordNumber: "37",
    title: "JIMMY COOKS",
    artist: "Drake feat. 21 Savage",
    cover: "./data/images/cover_10_1655936924.jpg",
  },
  {
    recordNumber: "38",
    title: "STAY",
    artist: "The Kid LAROI And Justin Bieber",
    cover: "./data/images/cover_24_1626311474.jpg",
  },
  {
    recordNumber: "39",
    title: "STAR WALKIN'",
    artist: "Lil Nas X",
    cover: "./data/images/cover_29_1664400652.jpg",
  },
  {
    recordNumber: "40",
    title: "SHUT DOWN",
    artist: "BLACKPINK",
    cover: "./data/images/cover_11_1663797634.jpg",
  },
];
</script>
