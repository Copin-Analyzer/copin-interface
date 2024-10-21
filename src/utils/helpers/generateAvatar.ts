const EMOJII =
  '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 🥹 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😮‍💨 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🫣 🤗 🤔 🫢 🤭 🤫 🤥 😶 😶‍🌫️ 😐 😑 😬 🫠 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 😵‍💫 🫥 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾 🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🐛 🦋 🐌 🐞 🐢 🐍 🦖 🐙 🦑 🦐 🦀 🪸 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐲 🦥 🌵 🎄 🌲 🌳 🍀 🍁 🍄 🐚 🌹 🌺 🌸 🌼 🔥 🌈 💧 ⛄️ 🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🌶 🫑 🌽 🥐 🍞 🥖 🧀 🥚 🥪 🧇 🍔 🍟 🍕 🌮 🍙 🍘 🍥 🍣 🥮 🎂 🍭 🍿 🍩 🍪 🍼 🍺 🍷 ⚽️ 🏀 🏈 ⚾️ 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🎨 🧩 🏵 🥊 🍯'

const emojiList = EMOJII.split(' ')

function lighten(col: string, amt: number) {
  let usePound = false

  if (col[0] == '#') {
    col = col.slice(1)
    usePound = true
  }

  const num = parseInt(col, 16)

  let r = (num >> 16) + amt

  if (r > 255) r = 255
  else if (r < 0) r = 0

  let b = ((num >> 8) & 0x00ff) + amt

  if (b > 255) b = 255
  else if (b < 0) b = 0

  let g = (num & 0x0000ff) + amt

  if (g > 255) g = 255
  else if (g < 0) g = 0

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
}

const mapCharToNumber = (char: string) => {
  const code = char.charCodeAt(0)
  if (code >= 'g'.charCodeAt(0) && code <= 'z'.charCodeAt(0)) {
    return (code - 'g'.charCodeAt(0)) % 10
  }
  return char
}

export const generateAvatar = (address: string) => {
  let renderAddress
  if (address?.startsWith('dydx')) {
    const addressWithoutPrefix = address.slice(5)
    renderAddress = Array.from(addressWithoutPrefix, mapCharToNumber).join('')
  }
  const emojiHex = renderAddress ? renderAddress.slice(0, 2) : address.slice(2, 4)
  const emoji = emojiList[parseInt(emojiHex, 16)]
  const bg = `#${renderAddress ? renderAddress.slice(3, 9) : address.slice(5, 11)}`
  return {
    emoji,
    bg,
    gradient: `linear-gradient(-70deg, ${lighten(bg, 50)} 0%, ${lighten(bg, 50)} 41%, ${bg} 40%, ${bg} 100%)`,
  }
}
