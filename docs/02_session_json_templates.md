# Session JSON Templates v1.1

## 目的

この文書は、教材データの投入・seed・Firestore 登録時のフォーマットを固定するためのテンプレートである。

教材データは secure-by-design のため、以下の3層に分離する。

- sessions_catalog: 一覧用の公開メタデータ
- sessions_learning: 学習開始時に必要なデータ
- sessions_review: 提出後のみ返す保護データ

## 命名規則

- Reading sessionId: `reading-0001`, `reading-0002`, ...
- Listening sessionId: `listening-0001`, `listening-0002`, ...

## 共通前提

- `estimatedMinutes` は持たない
- `difficultyLabel` は持たない
- 全教材の難易度は B2〜C1 程度で統一する

---

## 2.1 Reading: catalog template

```json
{
  "sessionId": "reading-0001",
  "sessionType": "reading",
  "sessionNumber": 1,
  "titleIt": "Il cambiamento delle abitudini di studio online",
  "titleJa": "オンライン学習習慣の変化",
  "theme": "educazione",
  "heroIllustrationPath": "/illustrations/leggere/reading-0001.svg",
  "isPublished": true,
  "createdAt": "__SERVER_TIMESTAMP__",
  "updatedAt": "__SERVER_TIMESTAMP__"
}
```

---

## 2.2 Reading: learning template

```json
{
  "sessionId": "reading-0001",
  "body": {
    "paragraphs": [
      {
        "paragraphIndex": 0,
        "sentences": [
          {
            "sentenceId": "reading-0001_p0_s0",
            "text": "Negli ultimi anni sempre più studenti hanno iniziato a seguire corsi online invece di frequentare soltanto lezioni in presenza."
          },
          {
            "sentenceId": "reading-0001_p0_s1",
            "text": "Questo cambiamento è stato possibile grazie alla diffusione di Internet e alla disponibilità di nuovi strumenti digitali."
          }
        ]
      }
    ],
    "wordCount": 612
  },
  "questions": [
    {
      "questionId": "rq1",
      "type": "main_idea",
      "prompt": "Qual è l'idea principale del brano?",
      "choices": [
        { "choiceId": "A", "text": "Gli studenti preferiscono evitare ogni tipo di tecnologia." },
        { "choiceId": "B", "text": "L'apprendimento online sta modificando le abitudini di studio." },
        { "choiceId": "C", "text": "Le università stanno eliminando tutte le lezioni in presenza." },
        { "choiceId": "D", "text": "Internet è usato soltanto per il divertimento." }
      ]
    },
    {
      "questionId": "rq2",
      "type": "detail",
      "prompt": "Secondo il testo, che cosa ha reso possibile questo cambiamento?",
      "choices": [
        { "choiceId": "A", "text": "La riduzione del numero di studenti." },
        { "choiceId": "B", "text": "La chiusura delle scuole tradizionali." },
        { "choiceId": "C", "text": "La diffusione di Internet e di strumenti digitali." },
        { "choiceId": "D", "text": "La diminuzione dell'interesse per lo studio." }
      ]
    }
  ]
}
```

---

## 2.3 Reading: review template

```json
{
  "sessionId": "reading-0001",
  "answerKey": [
    {
      "questionId": "rq1",
      "correctChoiceId": "B",
      "shortRationaleJa": "本文全体では、オンライン学習が学習習慣を変えていることが中心的に述べられているため。"
    },
    {
      "questionId": "rq2",
      "correctChoiceId": "C",
      "shortRationaleJa": "本文2文目に、インターネットの普及と新しいデジタルツールの利用可能性が理由だとあるため。"
    }
  ],
  "reviewBody": {
    "paragraphs": [
      {
        "paragraphIndex": 0,
        "sentences": [
          {
            "sentenceId": "reading-0001_p0_s0",
            "text": "Negli ultimi anni sempre più studenti hanno iniziato a seguire corsi online invece di frequentare soltanto lezioni in presenza.",
            "translation": "近年、ますます多くの学生が、対面授業だけに通うのではなく、オンライン講座を受け始めている。",
            "analysis": {
              "structure": "主節は 'sempre più studenti hanno iniziato...'。'invece di + 不定詞' は『〜する代わりに』を表す。",
              "grammarPoints": [
                {
                  "label": "invece di + 不定詞",
                  "explanationJa": "『〜する代わりに』を表す表現。ここでは、対面授業に通うこととオンライン講座を受けることが対比されている。"
                }
              ],
              "vocabNotes": [
                {
                  "label": "frequentare",
                  "explanationJa": "学校・授業・講座などに『通う』『出席する』の意味で使う。"
                }
              ]
            },
            "ttsText": "Negli ultimi anni sempre più studenti hanno iniziato a seguire corsi online invece di frequentare soltanto lezioni in presenza."
          }
        ]
      }
    ]
  },
  "wordGlossary": [
    {
      "lemma": "frequentare",
      "surfaceForms": ["frequentare"],
      "pos": "verbo",
      "morphology": "infinito",
      "meaningJa": "通う、出席する",
      "collocations": [
        {
          "it": "frequentare un corso",
          "ja": "講座に通う"
        },
        {
          "it": "frequentare l'università",
          "ja": "大学に通う"
        }
      ]
    }
  ]
}
```

---

## 2.4 Listening: catalog template

```json
{
  "sessionId": "listening-0001",
  "sessionType": "listening",
  "sessionNumber": 1,
  "titleIt": "Un dialogo sul lavoro da remoto",
  "titleJa": "リモートワークについての会話",
  "theme": "lavoro",
  "heroIllustrationPath": "/illustrations/ascoltare/listening-0001.svg",
  "isPublished": true,
  "createdAt": "__SERVER_TIMESTAMP__",
  "updatedAt": "__SERVER_TIMESTAMP__"
}
```

---

## 2.5 Listening: learning template

```json
{
  "sessionId": "listening-0001",
  "audio": {
    "audioUrl": "/audio/listening/listening-0001.mp3",
    "durationSec": 92,
    "kind": "conversation"
  },
  "questions": [
    {
      "questionId": "lq1",
      "type": "gist",
      "prompt": "Di che cosa parlano principalmente i due interlocutori?",
      "choices": [
        { "choiceId": "A", "text": "Di un viaggio all'estero." },
        { "choiceId": "B", "text": "Di un cambiamento nelle modalità di lavoro." },
        { "choiceId": "C", "text": "Di un problema di salute." },
        { "choiceId": "D", "text": "Di un corso universitario." }
      ]
    },
    {
      "questionId": "lq2",
      "type": "speaker_intent",
      "prompt": "Perché una delle persone preferisce lavorare da casa?",
      "choices": [
        { "choiceId": "A", "text": "Perché guadagna di più." },
        { "choiceId": "B", "text": "Perché ha più tempo libero durante il lavoro." },
        { "choiceId": "C", "text": "Perché evita gli spostamenti e si organizza meglio." },
        { "choiceId": "D", "text": "Perché non vuole parlare con i colleghi." }
      ]
    }
  ]
}
```

---

## 2.6 Listening: review template

```json
{
  "sessionId": "listening-0001",
  "answerKey": [
    {
      "questionId": "lq1",
      "correctChoiceId": "B",
      "shortRationaleJa": "会話全体は働き方の変化、特に在宅勤務について述べているため。"
    },
    {
      "questionId": "lq2",
      "correctChoiceId": "C",
      "shortRationaleJa": "通勤を避けられ、自分の時間管理がしやすい点が理由として述べられているため。"
    }
  ],
  "transcript": {
    "segments": [
      {
        "segmentId": "listening-0001_seg0",
        "sentenceId": "listening-0001_s0",
        "speakerId": "sp1",
        "speakerName": "Giulia",
        "startSec": 0.0,
        "endSec": 4.8,
        "text": "Da quando lavoro da casa, riesco a organizzare meglio la mia giornata.",
        "translation": "在宅で働くようになってから、一日の予定をよりうまく組めるようになったの。",
        "analysis": {
          "structure": "Da quando ... は『〜して以来』。主節は 'riesco a organizzare...'。",
          "grammarPoints": [
            {
              "label": "Da quando",
              "explanationJa": "『〜して以来』を表す表現。ある時点から現在までの継続や変化を示す。"
            }
          ],
          "vocabNotes": [
            {
              "label": "organizzare la giornata",
              "explanationJa": "一日の予定や時間の使い方を組み立てる表現。"
            }
          ]
        }
      }
    ]
  },
  "wordGlossary": [
    {
      "lemma": "organizzare",
      "surfaceForms": ["organizzare"],
      "pos": "verbo",
      "morphology": "infinito",
      "meaningJa": "整理する、計画する",
      "collocations": [
        {
          "it": "organizzare il tempo",
          "ja": "時間を管理する"
        },
        {
          "it": "organizzare la giornata",
          "ja": "一日の予定を組む"
        }
      ]
    }
  ]
}
```

## 備考

- `sessions_learning` には正答や訳や解説を入れない
- `sessions_review` は server-only データとして扱う
- `titleJa` は運営確認用であり、フロントで表示しなくてもよい
- `__SERVER_TIMESTAMP__` は seed 時にサーバーで置換する