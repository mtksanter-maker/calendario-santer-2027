# Calendário de Endomarketing 2027: app local

App web do calendário de endomarketing da Santer. Roda no próprio computador, sem instalar nada, porque usa o PowerShell que já vem no Windows. Não tem login.

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
│  ├─ calendario-2027.json  os dados
│  └─ backups/              cópias automáticas a cada gravação
└─ web/
   ├─ index.html
   ├─ css/estilo.css        visual (marca Santer + cores da legenda)
   ├─ js/app.js             todo o app, sem bibliotecas
   └─ favicon.svg
```

O servidor tem uma API simples:
- `GET /api/calendario` devolve o JSON.
- `PUT /api/calendario` grava o JSON. O cabeçalho `X-Versao` evita sobrescrever o trabalho de outra pessoa.

## Problemas comuns

**"Não foi possível usar a porta 8027"**
O app provavelmente já está aberto em outra janela. Se não estiver, rode `powershell -ExecutionPolicy Bypass -File servidor.ps1 -Porta 8028` e abra http://localhost:8028.

**A página diz que os dados não foram encontrados**
O `index.html` foi aberto direto, sem o servidor. Abra pelo `Iniciar calendario.bat`.

**Outras pessoas da rede querem acessar**
O servidor só atende este computador (localhost). Para uso em rede, o TI pode hospedar a pasta `web/` com a mesma API. Outra opção é mandar a cópia da página (.html) pelo menu **Arquivo**.
