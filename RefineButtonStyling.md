HTML:

<!-- From Uiverse.io by solid-metal -->
<div class="container">
  <div class="card">
    <p class="innerText">SAMPLE TEXT</p>
    <p class="innerText"></p>
    <p class="desc">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer id dictum
      augue, id viverra.
    </p>
  </div>
</div>

CSS:

/_ From Uiverse.io by solid-metal _/
.container {
position: relative;
height: 100%;
width: 100%;
display: flex;
justify-content: center;
align-items: center;
z-index: 0;
background-color: #dfdfdf;
}
.container::after {
content: " ";
position: absolute;
height: 150px;
width: 150px;
left: 50%;
top: 25%;
transform: translateX(-100%);
background-image: linear-gradient(orange, magenta);
border-radius: 50%;
z-index: -1;
border: 2px solid #ffffffa6;
box-shadow: inset 10px 0px 20px #fff;
animation: ani 28s ease-in-out infinite;
}
.container::before {
content: " ";
position: absolute;
height: 80px;
width: 80px;
left: 46%;
bottom: 25%;
transform: translateX(-100%);
background-image: linear-gradient(90deg, orange, magenta);
border-radius: 50%;
z-index: -1;
border: 2px solid #ffffffa6;
box-shadow: inset 10px 0px 20px #fff;
}
.card {
width: 190px;
height: 254px;
border: 1px solid #ffffff56;
border-radius: 10px;
backdrop-filter: blur(10.5px);
padding: 10px;
position: relative;
box-shadow: inset 2px 1px 6px #ffffff45;
overflow: hidden;
z-index: 0;
}
.card::after {
z-index: -1;
content: " ";
position: absolute;
width: 150%;
top: 0;
left: 0;
height: 10px;
background: #ffffff;
transform: rotateZ(50deg);
filter: blur(30px);
animation: shine 10s ease infinite;
}
.innerText {
color: transparent;
-webkit-background-clip: text;
background-image: linear-gradient(90deg, rgb(0, 0, 0), rgb(116, 111, 111));
font-size: 36px;
font-weight: 800;
line-height: 1em;
margin: 10px 0px;
}
@keyframes ani {
0% {
transform: translateX(0%) scale(1);
}
50% {
transform: translateX(-100%) scale(0.8);
}
100% {
transform: translateX(0%) scale(1);
}
}

@keyframes shine {
0% {
top: 100%;
left: -100%;
}
50%,
100% {
top: 0%;
left: 70%;
}
}
.desc {
padding: 4px;
color: #3a3939;
}
