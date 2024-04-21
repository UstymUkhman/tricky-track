# Tricky Track

![](https://img.shields.io/github/deployments/UstymUkhman/tricky-track/github-pages?style=flat-square)
![](https://img.shields.io/github/package-json/v/UstymUkhman/tricky-track?color=orange&style=flat-square)
![](https://img.shields.io/github/license/UstymUkhman/tricky-track?color=lightgrey&style=flat-square)

*Simple game with a procedurally generated track implemented in [three.js](https://threejs.org/) and [ammo.js](https://github.com/kripken/ammo.js).<br />
Physics simulation loop is run in a web worker context by leveraging [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) when [available](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).*

[![](./public/images/preview.gif)](https://ustymukhman.github.io/tricky-track/dist)

## Download

```bash
git clone https://github.com/UstymUkhman/tricky-track.git
cd tricky-track
```

## Develop

```bash
pnpm i
pnpm start
```

## Build

```bash
pnpm build
pnpm serve
```
