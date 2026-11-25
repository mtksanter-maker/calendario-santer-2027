# Central de Endomarketing Santer 2027

[Abrir o aplicativo](https://mtksanter-maker.github.io/calendario-santer-2027/)

Calendário operacional e planejamento completo: 12 meses, programas recorrentes, orçamento, produtividade, LinkedIn e pesquisa.

Na versão GitHub Pages, as edições ficam salvas **somente no navegador utilizado**. Use **Exportar backup completo** para guardar todos os módulos ou transferi-los usando **Importar backup completo**. As edições não são compartilhadas automaticamente entre pessoas.

O repositório contém o código e todos os dados iniciais do app. O deploy é automático a cada commit em `main`.

## Executar e verificar

```sh
node ferramentas/build-pages.mjs
node ferramentas/servir-pages.mjs
# Em outro terminal, com Edge instalado:
node ferramentas/testar.mjs http://127.0.0.1:8032/ --pages
```

No Windows, `Iniciar calendario.bat` abre a versão original com servidor local e gravação em arquivos. Veja [as instruções completas](LEIA-ME.md).
