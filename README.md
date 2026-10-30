# Deep Spear · Pesca Sub Costa Verde

Jogo 3D de pesca submarina em apneia na baía de Angra dos Reis (Three.js, arquivo único).

- Jogar: https://nicolasilvar09-bit.github.io/pesca-sub/
- Código-fonte em `src/` (HTML, CSS e JS separados por módulo)
- `vendor/three.min.js`: Three.js r149
- Gerar o `index.html`: `python3 build.py`

## Teste antes de publicar

```
python3 build.py && node tests/smoke.js
```

Compila o JavaScript (pega erro de sintaxe e nome declarado duas vezes) e abre o jogo nos 3 destinos
num navegador sem tela (Playwright): lancha, mergulho, todas as abas da loja, um campeonato inteiro e
um Mundial. Se aparecer "NÃO publicar", algo quebrou.
