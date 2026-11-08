// Elenco do clipe "Abraão Confiou" (parâmetros para createCharacter).
import { POSES } from './character.js';
export const ELENCO = {
  // professora/cantora: cabelo castanho ondulado com risca, óculos pretos, pinta, brincos de pérola,
  // camiseta roxa e calça jeans clara larga
  professora: { idade: 'adulto', menina: true, pele: '#f2c09c', penteado: 'liso', corCabelo: '#7a3a18', corOlhos: '#6a3a1e',
    oculos: '#141011', pinta: true, brincos: true, roupa: 'camiseta', corRoupa: '#7d2fa6', calcaLonga: true, corCalca: '#a9c2de', corSapato: '#8a4a2e', semente: 2 },
  abraao: { idade: 'adulto', pele: '#d49c74', penteado: 'manto', corPano: '#efe6d2', barba: '#f3f2ee', corCabelo: '#e8e6e0', corSobrancelha: '#f3f2ee',
    corOlhos: '#5a3a22', roupa: 'tunica', corRoupa: '#e6d6b8', capa: '#7b4a2a', faixa: '#b5492f', corSapato: '#7a4a2a', cajado: true, semente: 5 },
  sara: { idade: 'adulto', menina: true, pele: '#e3ad87', penteado: 'veu', corPano: '#d99c8a', corCabelo: '#3a2216', corOlhos: '#6a3a1a',
    roupa: 'vestido', saiaLonga: true, corRoupa: '#3f8f9c', faixa: '#e0b84a', corSapato: '#8a5a3a', bebe: true, semente: 7 },
  criancas: [
    { idade: 'crianca', menina: true, pele: '#9a603e', penteado: 'coquinhos', corCabelo: '#24150e', corOlhos: '#5a3418', roupa: 'vestido', corRoupa: '#f2b632', corSapato: '#ff6f9a', semente: 11 },
    { idade: 'crianca', pele: '#f3c9a6', penteado: 'lateral', corCabelo: '#c8562a', corOlhos: '#2f7fe0', roupa: 'camiseta', corRoupa: '#4aa3df', corCalca: '#3a4f9a', corSapato: '#ef5b52', semente: 12 },
    { idade: 'crianca', menina: true, pele: '#c98f63', penteado: 'rabo', corCabelo: '#3a2416', corOlhos: '#3f9a5a', roupa: 'vestido', corRoupa: '#e8507a', corSapato: '#ffd23a', semente: 13 },
    { idade: 'crianca', pele: '#6e4128', penteado: 'espetado', corCabelo: '#120a06', corOlhos: '#4a2a14', roupa: 'polo', corRoupa: '#ff8a3d', corCalca: '#2f6f8f', corSapato: '#30c0b0', semente: 14 },
  ],
};
export { POSES };
