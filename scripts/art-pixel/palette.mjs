import { hex, ramp } from './canvas.mjs';

// Rampas de 5 tons (escuro -> claro), com sombras puxando para o roxo e luzes para o quente.
export const P = {
  outline: hex('#0d0a0a'),

  // Humanos
  skin: ramp('#2e1d17', '#5a3a2c', '#8a5e45', '#b88661', '#d9ab84'),
  skinPale: ramp('#33221c', '#634536', '#946a52', '#c09272', '#dfb894'),
  lips: ramp('#2a1010', '#4a1c1a', '#6e2c26', '#8f3e33', '#a85444'),

  // Mortos-vivos
  rot: ramp('#1a1916', '#36342c', '#5e5a4b', '#8a836c', '#b3ab90'),
  deadFlesh: ramp('#1e1a1f', '#3a323a', '#5d5059', '#83737a', '#a8979a'),
  rotRed: ramp('#1f1011', '#3c1d1c', '#5c2f2a', '#7c443b', '#995a4c'),
  rotPale: ramp('#24221f', '#45413a', '#6a6455', '#8f8771', '#b0a68c'),
  muscle: ramp('#260809', '#4a1012', '#721c1b', '#962e26', '#b4483a'),
  blood: ramp('#1c0505', '#3d0a0a', '#661111', '#8c1a17', '#ad2a20'),
  bone: ramp('#4a4436', '#7d7461', '#ada28a', '#d6ccb2', '#efe8d4'),
  eyeGlow: hex('#f2e9a0'),
  eyeDim: hex('#b8ad6a'),
  teeth: hex('#d8cfb4'),

  // Roupas dos zumbis
  shirtBlue: ramp('#141b21', '#24303a', '#384856', '#4f6273', '#687d8e'),
  pantsGrey: ramp('#141418', '#24252b', '#36373f', '#4b4d57', '#62656f'),
  tankBeige: ramp('#26221e', '#4a433a', '#73695a', '#9a8e7a', '#bcb09a'),
  pantsGreen: ramp('#121610', '#20281b', '#323e29', '#46553a', '#5c6c4c'),
  hairDark: ramp('#0e0a09', '#1f1612', '#33241c', '#4a3628', '#614736'),
  hairGrey: ramp('#1a1918', '#33312e', '#4f4c47', '#6e6a63', '#8d8880'),

  // Heróis
  hairAuburn: ramp('#120c0a', '#2a1a14', '#45291d', '#633d29', '#7f5236'),
  olive: ramp('#191c10', '#2e3420', '#454f30', '#5e6b40', '#7a8752'),
  charcoal: ramp('#121315', '#212327', '#32353b', '#464a52', '#5d626b'),
  boots: ramp('#140c08', '#2b1a10', '#45291a', '#5f3a25', '#7a4e33'),
  scarf: ramp('#2a0b0b', '#521414', '#7d1f1c', '#a32f26', '#c44a35'),
  hat: ramp('#1a0f08', '#3a2414', '#5a3a20', '#7c5430', '#9c6e42'),
  tan: ramp('#2e2416', '#5a4a30', '#87704a', '#b09564', '#cfb682'),
  leather: ramp('#140a06', '#2a1a10', '#42291a', '#5b3a25', '#744d32'),
  jeans: ramp('#0f1622', '#1c2a40', '#2c3f5c', '#3f567a', '#567096'),
  gold: ramp('#4a3208', '#8a6214', '#c4921e', '#e8bf3a', '#fff07a'),
  flannel: ramp('#2a0a08', '#541512', '#80221b', '#a83526', '#c7503a'),
  khaki: ramp('#1c160e', '#352a1a', '#524229', '#6f5a39', '#8b744c'),
  beard: ramp('#140c08', '#2e1c12', '#4a2e1c', '#664028', '#805436'),

  // Armas
  metal: ramp('#0e0f12', '#1f2228', '#353a42', '#545a64', '#7d848f'),
  steel: ramp('#1a1c20', '#33363c', '#555960', '#7c8088', '#a8acb2'),
  wood: ramp('#1e0f07', '#3e2010', '#5e3418', '#7d4a24', '#9a6334'),
  sawBody: ramp('#3a1a04', '#7a3a08', '#b85a10', '#e07c1c', '#f5a43a'),
  flash: [hex('#fff8d6'), hex('#ffe27a'), hex('#ffb03a'), hex('#e0601c')],
};
