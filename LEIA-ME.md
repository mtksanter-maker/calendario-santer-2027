# Central de Endomarketing 2027: app local

## Versão online no GitHub Pages

A publicação inclui o calendário e todos os 15 conjuntos do Endomarketing. As alterações ficam **somente no navegador e dispositivo em uso**; não atualizam o repositório nem a tela de outras pessoas. Não existe sincronização entre usuários. Limpar os dados do site remove essas alterações.

Use **Exportar backup completo** no topo para guardar calendário, plano, LinkedIn, pesquisa e fichas dos 12 meses em um único JSON. **Importar backup completo** restaura esse arquivo em outro navegador. Os dados iniciais publicados são uma cópia dos arquivos de `dados/` no último deploy.

Para gerar: `node ferramentas/build-pages.mjs`. O resultado fica em `dist/`. Para testar: `node ferramentas/servir-pages.mjs`, depois `node ferramentas/testar.mjs http://127.0.0.1:8032/ --pages`. O teste usa um perfil descartável do Edge e não altera os arquivos de dados.

O workflow `.github/workflows/pages.yml` publica automaticamente ao enviar commits para `main`. O adaptador `web/js/pages.js` só é incluído no build estático; o uso local continua com o servidor original.

App web da Santer com dois módulos, escolhidos na barra lateral:

- **Calendário**: o calendário operacional de 2027, com todas as funções de antes (edição, categorias, impressão A4, exportação).
- **Endomarketing 2027**: o planejamento da campanha *Jeito Santer de Ser*: visão geral, jornada dos 12 meses, planejamento detalhado de cada mês, programas recorrentes, orçamento, produtividade, calendário editorial do LinkedIn e a base de pesquisa.

Roda no próprio computador, sem instalar nada, porque usa o PowerShell que já vem no Windows. Não tem login.

## Endomarketing 2027 em 1 minuto

- **Tudo é editável e salva sozinho.** O indicador no topo mostra “Salvando…” e depois “Salvo às hh:mm”. O botão de seta (ou Ctrl+Z) desfaz a última alteração. Cada gravação guarda a versão anterior em `dados/backups/endo/`.
- **Status das ações:** Planejado → Aguardando validação → Aprovado → Em execução → Executado → Avaliado (ou Cancelado).
- **Ligação com o calendário:** enquanto uma ação não está aprovada, as datas dela aparecem no calendário só como camada **“Em planejamento”** (contorno tracejado), sem virar evento oficial. Depois de aprovada, use **Publicar** (aba Resumo do mês) para criar o evento oficial, ou **Vincular** a um evento que já existe. Mudanças posteriores na proposta **não** mudam o evento oficial sozinhas: a tela avisa “Proposta difere do evento oficial” e oferece **Atualizar evento oficial**.
- No calendário, eventos vinculados mostram **“Ver iniciativa”**, e os eventos de endomarketing mostram **“Ver planejamento do mês”**.
- Camadas não oficiais no calendário (ligue e desligue na legenda): **Em planejamento**, **Programas recorrentes** (ginástica laboral) e **Publicações do LinkedIn**. Elas não entram na impressão oficial.
- **Orçamento:** os valores vêm das fichas como **[ESTIMATIVA]**. Itens sem preço aparecem “a cotar” e não contam como zero. O orçamento anual só aparece como aprovado quando alguém marca isso em Orçamento → Definição formal.
- **LinkedIn:** nada é publicado pelo sistema. O status só registra o que o Marketing fez.

## De onde vêm os dados do Endomarketing

A base de conhecimento está em `..\endo-2027\` (bíblia anual, fichas dos meses, pesquisa, orçamento, LinkedIn e `estruturado\`). Ela foi importada uma vez para `dados/endo/`:

```
node ferramentas/importar-planejamento.mjs                 # importa só o que ainda não existe
node ferramentas/importar-planejamento.mjs --substituir    # regrava (guarda a versão atual em dados/backups/endo)
node ferramentas/importar-planejamento.mjs --substituir --so=pesquisa,linkedin
```

Depois da importação, **os dados editáveis passam a ser os de `dados/endo/`**. Reimportar com `--substituir` volta os textos e valores aos das fichas (a versão anterior fica no backup); no plano, vínculos com o calendário, status, resultados, gastos realizados, sessões realizadas e pendências resolvidas são preservados.

| Arquivo | Conteúdo | Quando carrega |
|---|---|---|
| `plano.json` | campanha, 12 meses (ação, datas, orçamento, impacto, pendências, vínculos), programas e experiências | ao abrir o módulo (e, em segundo plano, para as camadas do calendário) |
| `mes-01.json` … `mes-12.json` | ficha completa de cada mês (seções em Markdown, etapas, responsáveis, comunicação) | só quando o mês é aberto |
| `linkedin.json` | 53 pautas semanais + coberturas | só ao abrir o LinkedIn ou ligar a camada |
| `pesquisa.json` | 147 registros de pesquisa e benchmarking | só ao abrir Pesquisa ou Referências |

## Como abrir

1. Dê dois cliques em **`Iniciar calendario.bat`**.
2. O navegador abre em **http://localhost:8027**.
3. Deixe a janela preta aberta enquanto usar o calendário. Para encerrar, feche essa janela.

Se o Windows perguntar se pode executar o arquivo, confirme. O `.bat` só chama o `servidor.ps1` desta pasta.

## Onde ficam os dados

- **`dados/calendario-2027.json`**: todas as datas, categorias e campanhas do mês.
- **`dados/backups/`**: guarda uma cópia da versão anterior a cada vez que alguém clica em **Salvar**. Ficam as 60 mais recentes.

Para voltar a uma versão antiga:
1. Feche o app.
2. Copie o backup desejado por cima de `dados/calendario-2027.json`.
3. Abra o app de novo.

## Editar

1. Clique em **Editar**. Aparece a barra de edição no rodapé.
2. Clique num dia para ver as datas dele e, no modo de edição, para editar, excluir ou **Adicionar**.
3. **Nova data** cria uma data em qualquer dia. No campo Categoria, a opção **Nova categoria** cria a categoria na hora.
4. **Desfazer** (ou Ctrl+Z) volta a última mudança. **Descartar** volta tudo ao que está salvo.
5. **Salvar** grava no arquivo de dados.

Se outra aba salvou antes de você, o app avisa. Você escolhe entre gravar a sua versão por cima ou carregar a que está salva.

## Imprimir em A4 horizontal

1. Selecione na legenda as categorias que deseja imprimir. Depois, clique em **Imprimir** no topo para preparar o ano completo, com uma folha por mês.
2. Na prévia, escolha **Ano completo** ou um mês específico. Dentro de um mês, o botão **Imprimir mês** já abre essa seleção.
3. Clique em **Imprimir / Salvar PDF**. O formato é **A4, horizontal (paisagem)**, com margem de 8 mm. Use escala de 100% e desative os cabeçalhos e rodapés do navegador, se aparecerem.
4. O calendário fica à esquerda e as descrições completas à direita. Os números nas datas correspondem aos números das descrições. A impressão respeita as categorias ativas e a seleção **Só o que é novo em 2027**. Por exemplo, se apenas **Feriado** estiver ativo, só os feriados e suas descrições serão impressos.

A impressão usa as datas e os textos atuais do calendário, inclusive alterações ainda em edição. Se um mês tiver conteúdo além do espaço de uma folha, a prévia cria folhas de continuação para manter as descrições completas.

## Categorias

No modo de edição, clique em **Categorias** na barra de baixo ou em **Gerenciar categorias** na legenda.

| Quero… | Como |
|---|---|
| Criar uma categoria | **Nova categoria** → nome, grupo e cor → **Criar categoria** |
| Renomear | Clique no nome, digite e aperte Enter |
| Trocar cor ou grupo | Clique no quadrado de cor da categoria |
| Mudar a ordem (legenda e prioridade de cor nos dias) | Setas ↑ ↓ |
| Trocar uma categoria por outra, levando as datas junto | **Substituir** → escolha uma categoria existente ou **Uma nova categoria…** → **Mover N datas e remover** |
| Apagar a categoria e todas as datas dela | **Excluir** → **Excluir categoria e N datas** |

Exemplo: para trocar "Comunica Santer" por "Comunica Obras":
1. Clique em **Substituir** na linha de Comunica Santer.
2. Deixe **Uma nova categoria…** selecionado e digite "Comunica Obras".
3. Escolha a cor e confirme.

As 79 datas vão para a nova categoria, que fica no mesmo lugar da antiga.

Tudo pode ser desfeito e só vale depois de **Salvar**.

## Levar dados entre o app e o calendário publicado no Claude

O app local e o calendário publicado no Claude guardam os dados separadamente. Para passar de um para o outro:

1. Na origem, use **Arquivo → Exportar dados (.json)**.
2. No destino, entre em **Editar → Arquivo → Importar dados…** e escolha o arquivo. Também aceita um `.html` exportado.
3. Revise e clique em **Salvar**.

O menu **Arquivo** também exporta:
- a **planilha (.csv)**, para o Excel;
- uma **cópia da página (.html)**, que abre em qualquer computador sem o servidor. Nessa cópia, as alterações ficam salvas só no navegador.

## Estrutura

```
app-calendario-2027/
├─ Iniciar calendario.bat   abre o servidor e o navegador
├─ servidor.ps1             servidor local (PowerShell): entrega web/ e grava dados/
├─ dados/
│  ├─ calendario-2027.json  os dados do calendário
│  ├─ endo/                 os dados do Endomarketing 2027 (ver acima)
│  └─ backups/              cópias automáticas a cada gravação (endo/ para o módulo)
├─ ferramentas/             importação, testes e medições (Node)
├─ backups/                 cópias do app inteiro antes das mudanças
└─ web/
   ├─ index.html            shell com a barra lateral
   ├─ css/base.css          sistema visual: cores, Liquid Glass, componentes
   ├─ css/estilo.css        calendário (tela e impressão A4)
   ├─ css/endo.css          módulo Endomarketing (carregado sob demanda)
   ├─ js/dados.js           leitura e gravação versionada dos dados
   ├─ js/app.js             calendário, sem bibliotecas
   ├─ js/shell.js           barra lateral, rotas, aparência
   └─ js/endo/              núcleo do módulo e uma tela por arquivo (carregadas sob demanda)
```

API do servidor:
- `GET/PUT /api/calendario`: calendário. O cabeçalho `X-Versao` evita sobrescrever o trabalho de outra pessoa.
- `GET/PUT /api/endo/<conjunto>` (`plano`, `linkedin`, `pesquisa`, `mes-01`…`mes-12`): mesma regra de versão; recusa (409) se outra pessoa salvou antes.
- Arquivos estáticos com revalidação (ETag) e compressão gzip guardada em memória.

## Aparência e acessibilidade

- Barra lateral: recolher/expandir (o estado fica guardado) e **Aparência** automática, clara ou escura.
- Menus, barras de ferramentas, filtros, popovers e painéis usam material translúcido (Liquid Glass); tabelas e textos ficam em superfícies sólidas. Com “Reduzir transparência” ou “Alto contraste” do sistema, o vidro vira superfície sólida. Com “Reduzir movimento”, as animações são desligadas.
- No celular, a barra lateral vira uma barra inferior.

## Testes e medições (para o TI)

Rode sempre contra uma **cópia** dos dados, nunca contra `dados/` em uso:

```
powershell -ExecutionPolicy Bypass -File servidor.ps1 -Porta 8031 -SemNavegador -PastaDados C:\caminho\copia-dos-dados
node ferramentas/testar.mjs http://localhost:8031/          # 71 verificações de ponta a ponta no Edge
node ferramentas/capturas.mjs http://localhost:8031/ capturas 1440 900 light
node ferramentas/medir.mjs http://localhost:8031/ medicao.json 9
```

## Voltar à versão anterior do app

- `backups/antes-central-endomarketing_*.zip` tem o app inteiro (código e dados) de antes destas mudanças.
- A pasta também é um repositório git local: o primeiro commit é o calendário original.

## Problemas comuns

**"Não foi possível usar a porta 8027"**
O app provavelmente já está aberto em outra janela. Se não estiver, rode `powershell -ExecutionPolicy Bypass -File servidor.ps1 -Porta 8028` e abra http://localhost:8028.

**A página diz que os dados não foram encontrados**
O `index.html` foi aberto direto, sem o servidor. Abra pelo `Iniciar calendario.bat`.

**Outras pessoas da rede querem acessar**
O servidor só atende este computador (localhost). Para uso em rede, o TI pode hospedar a pasta `web/` com a mesma API. Outra opção é mandar a cópia da página (.html) pelo menu **Arquivo**.
