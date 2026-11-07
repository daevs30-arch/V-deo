# Vozes próprias — "Prestação de contas: Joel da Harpa"

Mande um áudio único com as falas em sequência (pausa de ~1 s entre elas) ou um
arquivo por fala, com o número no começo do nome.

| Arquivo | Fala |
|---|---|
| `01_faisca` | Doze anos, três mandatos e muito trabalho. Esta é a prestação de contas do deputado Joel da Harpa. |
| `02_faisca` | Eleito em 2014 para a Assembleia Legislativa de Pernambuco, ele foi reeleito em 2018 e em 2022. |
| `03_faisca` | Na segurança pública, presidiu a Comissão de Segurança da Assembleia e defendeu os policiais e bombeiros militares. |
| `04_faisca` | **(nova)** Pela proteção das mulheres, é autor da lei que obriga bares, restaurantes e casas de espetáculo a exibir cartazes com os números 190 e 180, para denunciar a violência contra a mulher. |
| `05_faisca` | Na inclusão, é autor da lei que garante merenda escolar adaptada para crianças com seletividade alimentar, como muitas crianças autistas. |
| `06_faisca` | Ele coordenou a frente parlamentar pela inclusão de estudantes com transtornos do neurodesenvolvimento e levou o tema do autismo na escola para audiências públicas. |
| `07_faisca` | **(nova)** Na educação, é autor da lei que cria o programa estadual de incentivo ao desempenho escolar, que reconhece e premia estudantes da rede pública que se destacam. |
| `08_faisca` | E também é autor da lei que proíbe o adestramento de animais com violência em Pernambuco. |
| `09_faisca` | **(nova)** Pela família, é autor da lei que incluiu o Dia dos Pais e o Dia das Mães no calendário oficial de Pernambuco. |
| `10_faisca` | Agora, o mandato termina. Mas Joel da Harpa garante: mesmo sem mandato, vai continuar trabalhando por Pernambuco. |
| `11_faisca` | Obrigado, Pernambuco, pela confiança de todos esses anos! |

Depois rode:
`python3 roteiro_prestacao.py && node render.mjs --cena prestacao.html --build build/prestacao --out ../prestacao_de_contas_joel_da_harpa.mp4 --titulo "Prestação de contas: Joel da Harpa, 12 anos na Alepe" --sem-assinatura`
