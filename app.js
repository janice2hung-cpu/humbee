/*
 * Media Heroes — client-side interactive story
 * All story progress is kept in browser history state, so the in-app back
 * control and the browser's Back command restore the exact earlier scene.
 */

const icons = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"/><path d="m8.4 12 2.25 2.25L15.9 9"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`,
  amy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7.5" r="3.25"/><path d="M5.5 21v-1.1a6.5 6.5 0 0 1 13 0V21"/><path d="M5.6 4.8a7.7 7.7 0 0 1 12.8 0"/></svg>`,
  social: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20v-1.25a5 5 0 0 1 5-5h1.5a5 5 0 0 1 5 5V20"/><circle cx="9.75" cy="7" r="3.25"/><path d="M16.5 9.2a2.45 2.45 0 1 0 0-4.9"/><path d="M17.6 13.7a4.05 4.05 0 0 1 3.4 4V20"/></svg>`,
  bystander: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="2.6"/><circle cx="16.5" cy="8" r="2.6"/><path d="M3.5 20v-1.1a4.5 4.5 0 0 1 4.5-4.5h.1a4.5 4.5 0 0 1 4.5 4.5V20"/><path d="M12.2 15.2a4.4 4.4 0 0 1 3.8-2.2h.5a4 4 0 0 1 4 4V20"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/></svg>`,
};

const initialGame = () => ({
  actions: [],
  pending: null,
});

let game = initialGame();
let currentSceneId = "home";
let toastTimer;

const roleMap = {
  amy: { label: "Amy 視角", icon: icons.amy },
  social: { label: "學校社工視角", icon: icons.social },
  bystander: { label: "旁觀者視角", icon: icons.bystander },
};

const journeyIndex = {
  home: 0,
  "opening-amy": 0,
  s1: 0,
  s2: 0,
  "opening-social-v1": 1,
  "opening-social-v2": 1,
  s3_v1: 1,
  s3_v2: 1,
  s3_retry: 1,
  s4: 2,
  s5a: 2,
  s5b: 2,
  s5c: 2,
  s5d: 2,
  "opening-bystander": 3,
  s6: 3,
};

const sceneVisuals = {
  home: {
    src: "assets/s1-class-chat.png",
    alt: "校園像素畫：Amy 在課室裡看見手機班群中的未經同意照片，感到不安。",
  },
  s1: {
    src: "assets/s1-class-chat.png",
    alt: "校園像素畫：手機班群顯示一張 Amy 的尷尬照片和抽象訊息泡泡，Amy 在課室裡擔心地看著手機。",
  },
  s2: {
    src: "assets/s2-rumour-story.png",
    alt: "校園像素畫：Amy 在走廊中看著手機上的抽象限時動態式謠言畫面，遠處有同學在交談。",
  },
  s3v1: {
    src: "assets/s3-v1-disclosure.png",
    alt: "校園像素畫：Amy 在社工室向學校社工展示手機上的班群內容，社工安靜聆聽。",
  },
  s3v2: {
    src: "assets/s3-v2-disclosure.png",
    alt: "校園像素畫：Amy 在社工室說明手機上的兩類網絡內容，社工平靜地聆聽。",
  },
  repair: {
    src: "assets/s3-repair.png",
    alt: "校園像素畫：社工放下筆、以開放姿勢再次聆聽 Amy，兩人在安靜的社工室交談。",
  },
  plan: {
    src: "assets/s4-support-plan.png",
    alt: "校園像素畫：Amy 與學校社工一起查看有盾牌、對話和私隱圖示的支援計劃。",
  },
  privacy: {
    src: "assets/s5b-privacy.png",
    alt: "校園像素畫：Amy 看見螢幕上多個抽象轉發和通知圖示，社工注意到她的不安。",
  },
  delay: {
    src: "assets/s5c-delay.png",
    alt: "校園像素畫：放學後的空走廊裡，Amy 獨自看著不斷亮起通知的手機。",
  },
  confrontation: {
    src: "assets/s5d-confrontation.png",
    alt: "校園像素畫：社工以手勢暫停走廊中的面對面談話，Amy 顯得緊張但受到保護。",
  },
  bystander: {
    src: "assets/s6-bystander.png",
    alt: "校園像素畫：一名旁觀同學在手機前停下轉發動作，遠處有可求助的老師。",
  },
};

const lessons = {
  amyFirstSteps: {
    title: "Media Heroes 學習提示｜先保護自己，再尋找支持",
    items: [
      "保存有需要的資料，毋須把傷害內容再傳給更多人。",
      "不以報復或再轉發回應，減少二次傳播。",
      "可封鎖、舉報有害帳戶或內容，並向可信任的成年人求助。",
    ],
    note: "當網絡內容令人受傷時，得到支持不代表要獨自證明一切；可以一步一步處理。",
  },
  disclosure: {
    title: "Media Heroes 學習提示｜Responding to a disclosure",
    items: [
      "Stay calm：保持冷靜，避免倉促行動。",
      "Listen with empathy：以同理心聆聽 Amy 所經歷的事件和感受。",
      "Treat with respect and be supportive：以尊重的態度支持她，不責備、不淡化她的經歷。",
      "Check safety concerns：了解她是否有安全上的憂慮，以及事件是否仍在持續。",
    ],
    note: "被傾聽與被尊重，往往是披露後最重要的第一步。這些是支援者可參考的回應原則；實際跟進仍應按情況、學校程序及專業判斷處理。",
  },
  repair: {
    title: "Media Heroes 學習提示｜犯錯後，仍可重新聆聽",
    items: [
      "承認自己剛才的回應沒有接住對方，而不是為自己辯解。",
      "真誠道歉，重新把焦點放回 Amy 的感受與安全。",
      "讓 Amy 知道她可按自己的步伐說下去，也可一起商量下一步。",
    ],
    note: "修正不會抹去已造成的感受，但能讓對話重新有安全的空間。",
  },
  sharedPlan: {
    title: "Media Heroes 學習提示｜一起作決定",
    items: [
      "先了解事件是否仍在持續，以及 Amy 此刻的安全需要。",
      "整理所需資料、商討舉報和封鎖，避免額外轉發傷害內容。",
      "在可行範圍內讓 Amy 參與決定，尊重她的私隱和意願。",
    ],
    note: "好的支持不是代替當事人作所有決定，而是讓她在安全的情況下重新擁有選擇。",
  },
  repairChoice: {
    title: "Media Heroes 學習提示｜修正介入方式",
    items: [
      "暫停會增加壓力或曝光的做法，先說明和道歉。",
      "重新評估安全、私隱和 Amy 的準備程度。",
      "以最少披露和共同商討的方式，逐步連結合適支持。",
    ],
    note: "不同情況未必有單一處理方法；重要的是不把當事人的意願和安全放到最後。",
  },
  bystander: {
    title: "Media Heroes 學習提示｜旁觀者也能減少傷害",
    items: [
      "不轉發、不起哄，也不把有害內容當作談資。",
      "私下關心受影響的人，讓她知道不是孤身一人。",
      "把需要的資料交給能提供協助的可信任成年人，而非再傳到其他群組。",
    ],
    note: "旁觀者不需要獨自與所有人對抗；選擇不傳播並連結支持，已能改變群組文化。",
  },
};

const scenes = {
  home: {
    type: "home",
    visual: sceneVisuals.home,
    stage: "課堂互動故事",
    title: "Media Heroes\n數碼世界守護者",
    lead: "從不同角色的眼睛，練習看見網絡欺凌帶來的影響，以及能夠建立支持網的每一個選擇。",
    body: [
      "這是一個以香港校園情境設計的互動故事。你將先後成為 Amy、學校社工及旁觀者，親身經過同一件事的不同位置。",
      "故事中的選擇會呈現可能帶來的後果；它不是評分測驗，也不取代學校的既定程序或專業判斷。",
    ],
  },
  "opening-amy": {
    type: "interstitial",
    role: "amy",
    visual: sceneVisuals.s1,
    stage: "視角一 · 受事件影響的人",
    title: "你現在是 Amy",
    lead: "你剛發現，一張未經你同意的照片正在班級群組流傳。此刻最重要的，不是獨自承受。",
    body: "接下來的選擇會影響內容是否繼續擴散、你是否得到支持，以及你對事情的掌控感。",
    mission: "從 Amy 的位置出發：先照顧自己、避免讓傷害內容再擴散，並想想可以向誰求助。",
    next: "s1",
    nextLabel: "以 Amy 身分開始",
  },
  s1: {
    type: "scene",
    idLabel: "S1",
    role: "amy",
    visual: sceneVisuals.s1,
    title: "WhatsApp 群組的黑圖",
    lead: "某天，你發現班上的 WhatsApp group 突然變得非常熱鬧。",
    body: [
      "原來，有同學未經 Amy 同意，將她的「黑圖」上傳到群組，並加上侮辱性的文字。其他同學開始取笑 Amy，有人甚至把照片轉發到其他群組。",
      "Amy 發現後感到非常難過，也開始害怕回到學校。",
    ],
    quote: "群組訊息不斷彈出：有人取笑照片，也有人說「再 send 畀其他人睇」。",
    mission: "如果你是 Amy，此刻會怎樣做？",
    choices: [
      {
        key: "1A",
        label: "我立即在群組反擊，辱罵那些取笑我的同學，讓他們也感受被羞辱的滋味。",
        next: "s2",
        tone: "risk",
        outcome: "公開反擊或會令更多人加入爭論。內容被不斷截圖、轉發，事件可能更快擴散。",
      },
      {
        key: "1B",
        label: "我甚麼都不做，立即退出群組，假裝這件事沒有發生。",
        next: "s2",
        tone: "reflect",
        outcome: "暫時離開群組可讓 Amy 喘一口氣，但照片仍可能流傳；她也仍然要獨自面對壓力。",
      },
      {
        key: "1C",
        label: "我先保存群組對話及照片作為證據，封鎖及舉報相關帳戶，並向信任的老師或家人求助。",
        next: "opening-social-v1",
        tone: "support",
        outcome: "Amy 沒有再轉發傷害內容，並保存了資料、尋求可信任成人協助。她不必一個人處理。",
        action: "保存資料並及早求助",
        lesson: "amyFirstSteps",
      },
      {
        key: "1D",
        label: "我把照片轉發到其他群組，讓更多人知道有人欺負我，希望大家幫我討回公道。",
        next: "s2",
        tone: "risk",
        outcome: "即使 Amy 想獲得支持，轉發同一張照片也會令更多人看見它，形成二次傳播。",
      },
    ],
  },
  s2: {
    type: "scene",
    idLabel: "S2",
    role: "amy",
    visual: sceneVisuals.s2,
    title: "Instagram 上的緋聞謠言",
    lead: "因為事情沒有得到合適處理，情況開始變得更加嚴重。",
    body: [
      "第二天，Amy 回到學校，發現更多同學看過她的黑圖，甚至有人在走廊上偷偷議論她。",
      "她打開 Instagram，發現有同學在限時動態發布關於她的謠言；有人正在回覆、轉發，還在留言中取笑她。Amy 感到尷尬、憤怒和難過，擔心更多人會相信不實消息。",
    ],
    quote: "「聽講 Amy 同班上某個男同學有一腿喎！佢哋係咪已經秘密拍拖？😂」",
    mission: "如果你是 Amy，你會怎樣做？",
    choices: [
      {
        key: "2A",
        label: "立即在 Instagram 限時動態公開反擊，直接點名辱罵散播謠言的同學。",
        next: "opening-social-v2",
        tone: "risk",
        outcome: "互相指責可能令更多同學圍觀和截圖。事件得到更多注意，Amy 的壓力也可能上升。",
      },
      {
        key: "2B",
        label: "先保存限時動態及相關留言作為證據，不轉發謠言；舉報、封鎖相關帳戶，並向可信任的老師或學校社工求助。",
        next: "opening-social-v2",
        tone: "support",
        outcome: "Amy 保存了較完整的資料，沒有再擴散謠言，也主動連結到支持。",
        action: "不轉發謠言，保存資料並求助",
        lesson: "amyFirstSteps",
      },
      {
        key: "2C",
        label: "甚麼都不做，假裝沒有看見，亦不向任何人透露事件，希望過幾日大家便會忘記。",
        next: "opening-social-v2",
        tone: "reflect",
        outcome: "Amy 避開了當下的衝突，但謠言仍可能持續流傳；獨自承受會令壓力越積越多。",
      },
    ],
  },
  "opening-social-v1": {
    type: "interstitial",
    role: "social",
    visual: sceneVisuals.s3v1,
    stage: "視角二 · 支援者",
    title: "你現在是學校社工",
    lead: "Amy 在事情剛開始時便主動求助。你掌握到的是 WhatsApp 群組黑圖事件。",
    body: "你的任務不是立刻判斷、責備，或代替 Amy 決定。先讓她感到被聆聽、被理解，再了解她目前的安全需要。",
    mission: "由支援者角度出發：冷靜聆聽、尊重感受及私隱，並一起想下一步。",
    next: "s3_v1",
    nextLabel: "以學校社工身分繼續",
  },
  "opening-social-v2": {
    type: "interstitial",
    role: "social",
    visual: sceneVisuals.s3v2,
    stage: "視角二 · 支援者",
    title: "你現在是學校社工",
    lead: "Amy 前來求助時，黑圖和謠言都已出現。她很害怕事件會繼續傳開。",
    body: "你的任務不是立刻判斷、責備，或代替 Amy 決定。先讓她感到被聆聽、被理解，再了解她目前的安全需要。",
    mission: "由支援者角度出發：冷靜聆聽、尊重感受及私隱，並一起想下一步。",
    next: "s3_v2",
    nextLabel: "以學校社工身分繼續",
  },
  s3_v1: {
    type: "scene",
    idLabel: "S3_v1",
    role: "social",
    visual: sceneVisuals.s3v1,
    title: "接收 Amy 的求助",
    lead: "某天下午，Amy 主動來到你的辦公室，說最近在網絡上受到欺凌。",
    body: [
      "她向你展示 WhatsApp 群組中被公開的黑圖。",
      "Amy 看起來十分緊張，說完後低下頭，似乎不太願意繼續說下去。",
    ],
    quote: "「姑娘，我真係唔知點算……我啲黑圖而家 send 到滿天飛。我而家好驚返學，成日都覺得有人笑緊我。」",
    mission: "作為學校社工，你會怎樣回應 Amy？",
    choices: [
      {
        key: "3A",
        label: "責備 Amy，問佢有冇諗過點解其他人唔蝦、淨係蝦你一個，有冇喺自己身上面搵原因。",
        next: "s3_retry",
        tone: "risk",
        outcome: "把責任放回 Amy 身上，會令她感到被責怪和更不願意說下去。這段關係仍有機會修復。",
      },
      {
        key: "3B",
        label: "告訴 Amy：「船到橋頭自然直，呢啲小事你唔使咁緊張，過幾日就會冇事。」",
        next: "s3_retry",
        tone: "reflect",
        outcome: "淡化她的經歷可能令 Amy 覺得不被相信，也錯失了解她安全和壓力的機會。這段關係仍有機會修復。",
      },
      {
        key: "3C",
        label: "保持冷靜，耐心聆聽 Amy 的經歷及感受，表達理解和支持，並進一步了解她目前的安全情況及事件是否仍在持續。",
        next: "s4",
        tone: "support",
        outcome: "Amy 感到被接住。先聆聽和了解安全需要，能讓她更有空間參與下一步的決定。被傾聽與被尊重，往往是披露後最重要的第一步。",
        action: "耐心聆聽並了解安全需要",
        lesson: "disclosure",
      },
    ],
  },
  s3_v2: {
    type: "scene",
    idLabel: "S3_v2",
    role: "social",
    visual: sceneVisuals.s3v2,
    title: "接收 Amy 的求助",
    lead: "某天下午，Amy 主動來到你的辦公室，向你表示最近在網絡上受到欺凌。",
    body: [
      "她向你展示 WhatsApp 群組中的黑圖，以及 Instagram 上散播她與男同學緋聞的限時動態。",
      "Amy 看起來十分緊張。她怕更多人看見，也不知道還會不會有人繼續傳出去。",
    ],
    quote: "「老師，我真係唔知點算……好多人都睇過啲相同謠言，返到學校又有人笑我。我而家好驚返學。」",
    mission: "作為學校社工，你會怎樣回應 Amy？",
    choices: [
      {
        key: "3A",
        label: "責備 Amy，問佢有冇諗過點解其他人唔蝦、淨係蝦你一個，有冇喺自己身上面搵原因。",
        next: "s3_retry",
        tone: "risk",
        outcome: "把責任放回 Amy 身上，會令她感到被責怪和更不願意說下去。這段關係仍有機會修復。",
      },
      {
        key: "3B",
        label: "告訴 Amy：「船到橋頭自然直，呢啲小事你唔使咁緊張，過幾日就會冇事。」",
        next: "s3_retry",
        tone: "reflect",
        outcome: "淡化她的經歷可能令 Amy 覺得不被相信，也錯失了解她安全和壓力的機會。這段關係仍有機會修復。",
      },
      {
        key: "3C",
        label: "保持冷靜，耐心聆聽 Amy 的經歷及感受，表達理解和支持，並進一步了解她目前的安全情況及事件是否仍在持續。",
        next: "s4",
        tone: "support",
        outcome: "Amy 感到被接住。先聆聽和了解安全需要，能讓她更有空間參與下一步的決定。被傾聽與被尊重，往往是披露後最重要的第一步。",
        action: "耐心聆聽並了解安全需要",
        lesson: "disclosure",
      },
    ],
  },
  s3_retry: {
    type: "scene",
    idLabel: "S3_retry",
    role: "social",
    visual: sceneVisuals.repair,
    title: "重新建立對話的空間",
    lead: "Amy 聽完後沉默了一會兒，聲音更小了。",
    body: ["她的反應提醒你：剛才的說話沒有好好接住她。支援者也會犯錯，重要的是能否承認、修正和重新聆聽。"],
    quote: "「算啦，可能真係我自己有問題……我唔想再講喇。」",
    mission: "你會如何回應，讓 Amy 有機會重新感到安全？",
    choices: [
      {
        key: "3D",
        label: "承認自己剛才太快判斷，向 Amy 道歉；重新聆聽，告訴她不需要一個人承受，並先了解她現在是否安全。",
        next: "s4",
        tone: "support",
        outcome: "真誠承認和修正，不能抹去剛才的感受，卻可以讓 Amy 慢慢重拾一些安全感和選擇權。",
        action: "承認失誤並重新聆聽",
        lesson: "repair",
      },
      {
        key: "3E",
        label: "說：「如果你唔想講，我都幫唔到你。」然後結束談話。",
        next: "s3_retry_end",
        tone: "risk",
        outcome: "這會把求助的責任再次放在 Amy 身上。她離開時更孤單，也可能不再願意向成年人求助。",
      },
    ],
  },
  s4: {
    type: "scene",
    idLabel: "S4",
    role: "social",
    visual: sceneVisuals.plan,
    title: "一起商討下一步",
    lead: "因為你保持冷靜、耐心聆聽並尊重 Amy 的感受，你和 Amy 已初步建立信任；她願意繼續披露自己的情況。你知道事件仍有被轉發的情況，而 Amy 最近不太願意上學。",
    body: [
      "Amy 希望內容停止流傳，但也擔心事件被更多人知道。現在需要在安全、證據、私隱和她的意願之間，和她一起找合適的下一步。",
      "每個選項都會帶來不同的後果；你會怎樣開始？",
    ],
    mission: "作為支援者，你會採取哪一種跟進方式？",
    choices: [
      {
        key: "4A",
        label: "和 Amy 一起整理及保存資料、了解事件是否仍在持續，評估安全需要，再商討舉報、封鎖和校內支援等安排。",
        next: "s5a",
        tone: "support",
        outcome: "Amy 參與了處理方式的選擇。資料得到整理，支援可以按她的實際需要逐步安排。",
        action: "共同整理資料並商討支援",
        lesson: "sharedPlan",
      },
      {
        key: "4B",
        label: "未經 Amy 同意，立即聯絡所有涉事同學的家長，並把她的遭遇和截圖轉發給他們。",
        next: "s5b",
        tone: "risk",
        outcome: "目的可能是想盡快處理，但未先商討便轉發資料，會讓 Amy 感到私隱和控制感被忽略。",
      },
      {
        key: "4C",
        label: "建議 Amy 先忍耐一段時間，因為網絡上的事情通常很快會被忘記。",
        next: "s5c",
        tone: "reflect",
        outcome: "等待未必能令內容停止流傳。Amy 可能感到自己的困難未被重視，壓力和缺課風險也會增加。",
      },
      {
        key: "4D",
        label: "要求 Amy 立即與涉事同學當面對質，認為這樣才能一次過解決。",
        next: "s5d",
        tone: "risk",
        outcome: "未先評估 Amy 的意願和安全，可能令她感到被逼迫，也令衝突升溫。",
      },
    ],
  },
  s5a: {
    type: "scene",
    idLabel: "S5A",
    role: "social",
    visual: sceneVisuals.plan,
    title: "合作處理：支持網開始形成",
    lead: "你和 Amy 一起保存資料、確認仍在流傳的內容，並商討她希望誰知道、誰可以協助。",
    body: [
      "Amy 選擇先由一位信任的老師和家人陪伴她。你們也討論了合適的舉報及封鎖方法，並約好下次再檢視她在學校的感受。",
      "這不代表事情立即消失，但 Amy 不再需要獨自承受。接下來，旁觀者的選擇也可能影響事件走向。",
    ],
    mission: "準備看看另一個重要位置：看見事件的同學可以怎樣做。",
    choices: [
      {
        key: "5A-1",
        label: "在 Amy 同意及清楚知道安排的前提下，繼續以最少披露方式提供支持，並把注意力轉到如何減少傳播。",
        next: "opening-bystander",
        tone: "support",
        outcome: "共同決定和最少披露，有助保留 Amy 的掌控感。支持網正慢慢形成。",
        action: "尊重意願，以最少披露方式跟進",
        lesson: "sharedPlan",
      },
    ],
  },
  s5b: {
    type: "scene",
    idLabel: "S5B",
    role: "social",
    visual: sceneVisuals.privacy,
    title: "私隱被忽略後",
    lead: "Amy 知道你已把截圖和她的遭遇傳給多位家長後，顯得非常不安。",
    body: ["她問：「點解你未問過我，就 send 咗畀咁多人？」她擔心更多人談論自己，也覺得失去了控制。"],
    mission: "你可以怎樣修正這個跟進方式？",
    choices: [
      {
        key: "5B-1",
        label: "承認自己忽略了 Amy 的意願，停止非必要轉發；和她重新商討誰需要知道、怎樣以最少披露方式跟進。",
        next: "opening-bystander",
        tone: "support",
        outcome: "修正並不會抹去已發生的事，但停止額外披露、清楚說明和重新商討，能慢慢修復信任。",
        action: "停止非必要披露並重新商討",
        lesson: "repairChoice",
      },
      {
        key: "5B-2",
        label: "說：「我都係為你好，你唔需要知道咁多。」並繼續把資料傳給更多人。",
        next: "s5b_end",
        tone: "risk",
        outcome: "當事人的私隱和意願持續被忽略，Amy 可能更不願意求助，也承受額外的二次傷害。",
      },
    ],
  },
  s5c: {
    type: "scene",
    idLabel: "S5C",
    role: "social",
    visual: sceneVisuals.delay,
    title: "等待並沒有令事件停止",
    lead: "數天後，事件仍然在小群組內流傳。Amy 開始更不願意上學，也沒有再主動找人談。",
    body: ["等待未必是中性的選擇。當傷害內容持續流傳而沒有支持，當事人的壓力可能越來越大。"],
    mission: "你會怎樣重新介入？",
    choices: [
      {
        key: "5C-1",
        label: "主動關心 Amy，承認自己低估了事件；重新評估她的安全和情緒、整理資料，並與她商討即時支持。",
        next: "opening-bystander",
        tone: "support",
        outcome: "及時修正讓 Amy 知道她的感受被重視。支援雖然來得較遲，仍可逐步建立。",
        action: "重新評估安全並提供即時支持",
        lesson: "repairChoice",
      },
      {
        key: "5C-2",
        label: "繼續等，認為只要沒有人再提起，就不需要採取任何行動。",
        next: "s5c_end",
        tone: "reflect",
        outcome: "缺乏跟進會令 Amy 感到孤單，內容也可能在看不見的地方繼續流傳。",
      },
    ],
  },
  s5d: {
    type: "scene",
    idLabel: "S5D",
    role: "social",
    visual: sceneVisuals.confrontation,
    title: "被要求當面對質",
    lead: "聽到要立即和涉事同學對質，Amy 顯得更害怕，雙手緊握著書包帶。",
    body: ["對話或修復安排需要考慮當事人的意願、準備和安全。未準備好的對質，可能令她再次感到無力。"],
    mission: "你會如何調整？",
    choices: [
      {
        key: "5D-1",
        label: "尊重 Amy 的意願，暫停對質；改為先商討安全、支持和其他不需要她直接面對涉事者的方法。",
        next: "opening-bystander",
        tone: "support",
        outcome: "讓 Amy 重拾一些選擇權。不同情況可以有不同安排，重點是先照顧安全和感受。",
        action: "尊重意願，暫停直接對質",
        lesson: "repairChoice",
      },
      {
        key: "5D-2",
        label: "要求 Amy 要勇敢面對，堅持立刻安排對質。",
        next: "s5d_end",
        tone: "risk",
        outcome: "當她未準備好就被要求面對，可能令她更害怕，也削弱她對支援者的信任。",
      },
    ],
  },
  "opening-bystander": {
    type: "interstitial",
    role: "bystander",
    visual: sceneVisuals.bystander,
    stage: "視角三 · 旁觀者",
    title: "你現在是一名旁觀者",
    lead: "你不是事件的直接當事人，但你的選擇仍然可以改變它接下來怎樣發展。",
    body: "不轉發、停止起哄、私下關心及向可信任成人求助，都是有分量的行動。旁觀不等於無能為力。",
    mission: "從旁觀者角度出發：想想怎樣減少傷害內容的流傳，並讓受影響的人知道她不是孤身一人。",
    next: "s6",
    nextLabel: "以旁觀者身分繼續",
  },
  s6: {
    type: "scene",
    idLabel: "S6",
    role: "bystander",
    visual: sceneVisuals.bystander,
    title: "群組裡的一張 Meme 圖",
    lead: "放學後，你在另一個班級群組看到 Amy 的黑圖和緋聞被改成 Meme 圖。有人正在起哄，還有人問「有冇人再 send？」",
    body: [
      "你知道轉發只會令 Amy 受到更多傷害，但也擔心自己說話會被朋友取笑。",
      "即使不是直接參與的人，也可以選擇讓傷害停下來，或令它繼續擴散。",
    ],
    mission: "作為旁觀者，你會怎樣做？",
    choices: [
      {
        key: "6A",
        label: "不轉發或起哄；私下關心 Amy，保存必要資料並向可信任的老師或成年人反映。",
        next: "end_support_network",
        tone: "support",
        outcome: "你沒有幫助傷害內容擴散，也為 Amy 提供了支持和額外的求助連結。",
        action: "旁觀者選擇支持而不轉發",
        lesson: "bystander",
      },
      {
        key: "6B",
        label: "假裝沒看見，甚麼都不做，因為不想被捲入事件。",
        next: "end_silence",
        tone: "reflect",
        outcome: "沉默未必代表認同，但有害內容可能繼續流傳；Amy 也可能不知道有人願意站在她身邊。",
      },
      {
        key: "6C",
        label: "為了提醒更多朋友，將 Meme 圖再轉發到其他群組，叫大家不要相信。",
        next: "end_forwarding",
        tone: "risk",
        outcome: "出發點可能是澄清，但再次轉發仍會讓更多人看見傷害內容，造成二次傳播。",
      },
      {
        key: "6D",
        label: "在群組公開辱罵欺凌者，和他們展開罵戰。",
        next: "end_escalation",
        tone: "risk",
        outcome: "公開罵戰可能令更多人加入、截圖和圍觀，令事件由傷害轉成更大的網絡衝突。",
      },
    ],
  },
  s3_retry_end: {
    type: "ending",
    idLabel: "回顧結局",
    role: "social",
    visual: sceneVisuals.delay,
    variant: "care",
    banner: "求助的門被關上了",
    title: "一句話，也可能影響下一次求助",
    lead: "Amy 離開了辦公室。她未必會再主動找成年人談，也仍要獨自面對網上的內容和上學焦慮。",
    body: "這不是 Amy 的責任。支援者若未能先聆聽、理解和評估安全，可能讓她感到再次被拒絕。重新探索時，可以嘗試承認失誤、真誠道歉，並把選擇權交回給她。",
    reflection: "反思：當一個人說「我不想再講」，我可以怎樣回應，讓她知道自己仍然值得被好好聽見？",
  },
  s5b_end: {
    type: "ending",
    idLabel: "回顧結局",
    role: "social",
    visual: sceneVisuals.privacy,
    variant: "care",
    banner: "私隱與信任受損",
    title: "善意也需要尊重界線",
    lead: "更多人知道了 Amy 的遭遇，但她沒有參與這個決定。她感到被再次曝光，也更難相信支援者。",
    body: "真實情況中，安全需要和既定程序有時會要求支援者採取行動；重要的是清楚解釋、盡量採取最少披露，並讓當事人參與可以參與的決定。",
    reflection: "反思：我可以怎樣在提供支援時，同時保護一個人的私隱、掌控感和安全？",
  },
  s5c_end: {
    type: "ending",
    idLabel: "回顧結局",
    role: "social",
    visual: sceneVisuals.delay,
    variant: "reflect",
    banner: "延遲令壓力持續",
    title: "等待不是唯一選擇",
    lead: "事件在小群組裡繼續流傳，Amy 越來越不願意上學，也越來越覺得沒有人會明白。",
    body: "不代表每件事都要公開處理；但主動了解安全、保存必要資料、連結支持和一起商討下一步，能讓受影響的人不必獨自承受。",
    reflection: "反思：當我不確定怎樣做時，誰可以和我一起評估情況，而不是只希望問題自行消失？",
  },
  s5d_end: {
    type: "ending",
    idLabel: "回顧結局",
    role: "social",
    visual: sceneVisuals.confrontation,
    variant: "care",
    banner: "被迫面對，並非被支持",
    title: "安全和準備比「勇敢」更重要",
    lead: "Amy 被要求立刻面對涉事者，感到更害怕，也失去對處理方式的信任。",
    body: "有些情況也許需要對話或修復安排，但這應建立在充足準備、清楚界線、當事人意願和安全評估之上。",
    reflection: "反思：我有沒有先了解當事人現在是否準備好？還有沒有較安全、較少壓力的支持方法？",
  },
  end_support_network: {
    type: "ending",
    idLabel: "故事結局",
    role: "bystander",
    visual: sceneVisuals.bystander,
    variant: "positive",
    banner: "支持網正在形成",
    title: "不轉發，也是一種有力的選擇",
    lead: "你沒有讓傷害內容再擴散，並以關心和求助為 Amy 多連上一條支持線。",
    body: "網絡欺凌不會因一個人而立刻結束；但當受影響的人得到聆聽、支援和安全的選擇，當旁觀者拒絕傳播內容，改變便可以從群組裡的一個人開始。",
    reflection: "帶走的提醒：不要轉發傷害內容；保存必要資料；向可信任的人求助；用尊重的方式陪伴受影響的人。",
  },
  end_silence: {
    type: "ending",
    idLabel: "故事結局",
    role: "bystander",
    visual: sceneVisuals.bystander,
    variant: "reflect",
    banner: "沉默也有後果",
    title: "你仍然可以選擇支持",
    lead: "你沒有直接參與轉發，但群組裡的傷害內容沒有因此停下來。Amy 也未必知道有人看見她正在承受的事。",
    body: "不必獨自和整個群組對抗。私下關心、不轉發、向可信任的老師或成年人反映，都是既安全又有分量的旁觀者行動。",
    reflection: "帶走的提醒：旁觀者不需要做英雄式對抗；可以先做一個不讓傷害擴散、願意連結支持的人。",
  },
  end_forwarding: {
    type: "ending",
    idLabel: "故事結局",
    role: "bystander",
    visual: sceneVisuals.bystander,
    variant: "care",
    banner: "內容再一次被擴散",
    title: "澄清，不必靠再轉發",
    lead: "你原本想提醒朋友，但 Meme 圖和謠言又被更多人看見。",
    body: "面對有害內容時，可以不附上原圖或原文；保留必要資料給能協助的人，私下關心受影響者，並使用平台舉報和學校支援途徑。",
    reflection: "帶走的提醒：想支持一個人，不代表要再次讓傷害內容曝光。",
  },
  end_escalation: {
    type: "ending",
    idLabel: "故事結局",
    role: "bystander",
    visual: sceneVisuals.bystander,
    variant: "care",
    banner: "衝突升溫了",
    title: "反擊不一定能讓傷害停止",
    lead: "群組變成罵戰；更多同學圍觀、截圖，原本的傷害內容再次成為焦點。",
    body: "看見不公平時感到憤怒很自然。但以辱罵回應，常會令內容更加流傳。較安全的選擇是停止轉發、保留必要資料、支持受影響者並尋求成人協助。",
    reflection: "帶走的提醒：把焦點從罵贏對方，轉向怎樣讓受影響的人更安全、更有支持。",
  },
};

function cloneGame(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function proseHTML(lines = []) {
  return lines.map((line) => `<p>${escapeHTML(line)}</p>`).join("");
}

function labelForScene(scene) {
  if (scene.type === "home") return "故事首頁";
  if (scene.idLabel) return scene.idLabel;
  if (scene.type === "interstitial") return "視角轉換";
  return "故事頁面";
}

function rolePill(role) {
  if (!role || !roleMap[role]) return "";
  return `<span class="perspective-pill" data-role="${role}">${roleMap[role].icon}<span>${roleMap[role].label}</span></span>`;
}

function journeyHTML(sceneId) {
  const active = journeyIndex[sceneId] ?? 0;
  const stages = ["Amy 的經歷", "社工的回應", "共同跟進", "旁觀者的選擇"];
  return `<nav class="journey" aria-label="故事旅程">${stages
    .map((stage, index) => {
      const state = index === active ? "is-active" : index < active ? "is-done" : "";
      return `<div class="journey__step ${state}"><span class="journey__dot"></span><span>${stage}</span></div>`;
    })
    .join("")}</nav>`;
}

function topbarHTML() {
  const hasInAppParent = Boolean(history.state?.sceneId) && currentSceneId !== "home";
  return `<header class="topbar">
    <button class="brand" data-action="home" aria-label="回到故事首頁">
      <span class="brand__mark">${icons.shield}</span>
      <span class="brand__copy">Media Heroes · 數碼世界守護者</span>
    </button>
    <button class="back-button" data-action="back" ${hasInAppParent ? "" : "aria-disabled=\"true\""}>
      ${icons.back}<span>回到上一頁</span>
    </button>
  </header>`;
}

function helpNoteHTML() {
  return `<div class="help-note">${icons.info}<span>如故事內容令你感到不舒服，請暫停，並向你信任的成年人、老師、學校社工或合適的支援服務求助。</span></div>`;
}

function cardTopHTML(scene) {
  return `<div class="scene-topline"><span class="eyebrow">${escapeHTML(labelForScene(scene))}</span>${rolePill(scene.role)}</div>`;
}

function renderVisual(visual, modifier = "") {
  if (!visual) return "";
  return `<figure class="scene-visual ${modifier}">
    <img src="${escapeHTML(visual.src)}" alt="${escapeHTML(visual.alt)}" decoding="async" />
  </figure>`;
}

function renderLesson(lessonKey) {
  const lesson = lessons[lessonKey];
  if (!lesson) return "";
  return `<aside class="learning-card" aria-label="Media Heroes 學習提示">
    <span class="learning-card__eyebrow">Media Heroes · 學習提示</span>
    <h2>${escapeHTML(lesson.title.replace("Media Heroes 學習提示｜", ""))}</h2>
    <ol>${lesson.items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ol>
    <p>${escapeHTML(lesson.note)}</p>
  </aside>`;
}

function renderHome(scene) {
  return `<article id="story" class="story-card" tabindex="-1">
    ${cardTopHTML(scene)}
    <h1 class="title">${escapeHTML(scene.title).replace("\n", "<br />")}</h1>
    <p class="lead">${escapeHTML(scene.lead)}</p>
    ${renderVisual(scene.visual, "scene-visual--hero")}
    <div class="prose">${proseHTML(scene.body)}</div>
    <button class="primary-action" data-go="opening-amy">開始故事 ${icons.arrow}</button>
    ${helpNoteHTML()}
  </article>`;
}

function renderInterstitial(scene) {
  const role = scene.role;
  return `<article id="story" class="story-card interstitial-card" tabindex="-1">
    <div class="interstitial-icon interstitial-icon--${role}">${roleMap[role].icon}</div>
    ${cardTopHTML(scene)}
    <h1 class="scene-title">${escapeHTML(scene.title)}</h1>
    <p class="lead">${escapeHTML(scene.lead)}</p>
    ${renderVisual(scene.visual, "scene-visual--interstitial")}
    <div class="prose">${escapeHTML(scene.body)}</div>
    <div class="mission"><span class="mission__icon">✦</span><span><strong>新的任務</strong>${escapeHTML(scene.mission)}</span></div>
    <button class="primary-action" data-go="${scene.next}">${escapeHTML(scene.nextLabel)} ${icons.arrow}</button>
    ${helpNoteHTML()}
  </article>`;
}

function renderScene(scene) {
  return `<article id="story" class="story-card" tabindex="-1">
    ${cardTopHTML(scene)}
    <h1 class="scene-title">${escapeHTML(scene.title)}</h1>
    <p class="lead">${escapeHTML(scene.lead)}</p>
    ${renderVisual(scene.visual)}
    <div class="prose">${proseHTML(scene.body)}</div>
    ${scene.quote ? `<blockquote class="quote ${scene.idLabel === "S1" ? "quote--message" : ""}">${escapeHTML(scene.quote)}</blockquote>` : ""}
    <div class="mission"><span class="mission__icon">✦</span><span><strong>你的任務</strong>${escapeHTML(scene.mission)}</span></div>
    <div class="choices" aria-label="可選行動">${scene.choices
      .map(
        (choice) => `<button class="choice" data-choice="${choice.key}">
          <span class="choice__letter">${escapeHTML(choice.key.replace(/^.*?([A-E])$/, "$1"))}</span>
          <span class="choice__text">${escapeHTML(choice.label)}</span>
          <span class="choice__arrow" aria-hidden="true">→</span>
        </button>`,
      )
      .join("")}</div>
  </article>`;
}

function renderOutcome() {
  const pending = game.pending;
  if (!pending) {
    goTo("home", { replace: true });
    return "";
  }
  const toneClass = pending.tone === "support" ? "support" : pending.tone === "risk" ? "risk" : "";
  const emblem = pending.tone === "support" ? "✦" : pending.tone === "risk" ? "!" : "…";
  return `<article id="story" class="story-card outcome-card outcome-card--${toneClass}" tabindex="-1">
    <div class="outcome-emblem" aria-hidden="true">${emblem}</div>
    <div class="scene-topline"><span class="eyebrow">選擇後的可能影響</span>${rolePill(pending.role)}</div>
    <h1 class="scene-title">${escapeHTML(pending.title)}</h1>
    <div class="outcome-copy">${escapeHTML(pending.outcome)}</div>
    ${renderVisual(pending.visual, "scene-visual--outcome")}
    ${renderLesson(pending.lesson)}
    <button class="primary-action" data-action="continue">繼續故事 ${icons.arrow}</button>
    ${helpNoteHTML()}
  </article>`;
}

function renderActionLog() {
  if (!game.actions.length) return "";
  return `<section class="action-log" aria-label="守護行動紀錄"><h3>旅程中的守護行動</h3><ul>${game.actions
    .map((action) => `<li>${escapeHTML(action)}</li>`)
    .join("")}</ul></section>`;
}

function renderEnding(scene) {
  const badgeClass = scene.variant === "positive" ? "" : scene.variant === "care" ? "ending-banner--care" : "ending-banner--reflect";
  return `<article id="story" class="story-card" tabindex="-1">
    ${cardTopHTML(scene)}
    <span class="ending-banner ${badgeClass}">✦ ${escapeHTML(scene.banner)}</span>
    <h1 class="scene-title" style="margin-top:1rem">${escapeHTML(scene.title)}</h1>
    <p class="lead">${escapeHTML(scene.lead)}</p>
    ${renderVisual(scene.visual, "scene-visual--ending")}
    <div class="prose"><p>${escapeHTML(scene.body)}</p><p><strong>${escapeHTML(scene.reflection)}</strong></p></div>
    ${renderActionLog()}
    <div class="ending-actions">
      <button class="primary-action" data-action="restart">重新探索故事 ${icons.arrow}</button>
      <button class="secondary-action" data-action="home">回到故事首頁</button>
    </div>
    ${helpNoteHTML()}
  </article>`;
}

function render() {
  const scene = currentSceneId.startsWith("outcome-") ? null : scenes[currentSceneId] || scenes.home;
  const content = currentSceneId.startsWith("outcome-")
    ? renderOutcome()
    : scene.type === "home"
      ? renderHome(scene)
      : scene.type === "interstitial"
        ? renderInterstitial(scene)
        : scene.type === "ending"
          ? renderEnding(scene)
          : renderScene(scene);

  const app = document.querySelector("#app");
  app.innerHTML = `${topbarHTML()}${journeyHTML(currentSceneId)}${content}<p class="footer-note">Media Heroes 是用於網絡欺凌預防、同理及安全討論的學習情境；本互動故事不構成直接個案管理指引。</p>`;

  requestAnimationFrame(() => document.querySelector("#story")?.focus({ preventScroll: true }));
}

function statePayload() {
  return { sceneId: currentSceneId, game: cloneGame(game) };
}

function updateURL() {
  const safeId = currentSceneId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `#${safeId}`;
}

function goTo(sceneId, { replace = false } = {}) {
  currentSceneId = sceneId;
  const state = statePayload();
  if (replace) {
    history.replaceState(state, "", updateURL());
  } else {
    history.pushState(state, "", updateURL());
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function makeChoice(choiceKey) {
  const scene = scenes[currentSceneId];
  const choice = scene?.choices?.find((item) => item.key === choiceKey);
  if (!choice) return;

  if (choice.action && !game.actions.includes(choice.action)) {
    game.actions.push(choice.action);
  }
  game.pending = {
    title: choice.tone === "support" ? "這個選擇正在建立支持" : choice.tone === "risk" ? "這個選擇可能令傷害擴散" : "這個選擇值得再想一想",
    outcome: choice.outcome,
    next: choice.next,
    tone: choice.tone,
    role: scene.role,
    visual: choice.visual || scene.visual,
    lesson: choice.lesson,
  };
  goTo(`outcome-${scene.idLabel || currentSceneId}-${choice.key}`);
}

function continueStory() {
  if (!game.pending) return;
  const { next } = game.pending;
  game.pending = null;
  goTo(next);
}

function restart() {
  game = initialGame();
  goTo("opening-amy");
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2800);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.choice) {
    makeChoice(button.dataset.choice);
    return;
  }
  if (button.dataset.go) {
    goTo(button.dataset.go);
    return;
  }
  if (button.dataset.action === "continue") {
    continueStory();
    return;
  }
  if (button.dataset.action === "restart") {
    restart();
    return;
  }
  if (button.dataset.action === "home") {
    if (currentSceneId === "home") {
      showToast("你已在故事首頁。按「開始故事」可重新進入旅程。");
    } else {
      game = initialGame();
      goTo("home");
    }
    return;
  }
  if (button.dataset.action === "back") {
    if (currentSceneId === "home" || !history.state?.sceneId) {
      showToast("你已在故事首頁。按「開始故事」可進入旅程。");
    } else {
      history.back();
    }
  }
});

window.addEventListener("popstate", (event) => {
  const state = event.state;
  if (!state?.sceneId || !state.game) {
    game = initialGame();
    currentSceneId = "home";
    history.replaceState(statePayload(), "", updateURL());
  } else {
    currentSceneId = state.sceneId;
    game = cloneGame(state.game);
  }
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

function init() {
  const saved = history.state;
  const savedSceneIsValid =
    typeof saved?.sceneId === "string" &&
    (saved.sceneId.startsWith("outcome-") || Boolean(scenes[saved.sceneId]));

  if (savedSceneIsValid && saved?.game) {
    currentSceneId = saved.sceneId;
    game = cloneGame(saved.game);
  } else {
    // A bare hash should not skip a required perspective-opening page.
    currentSceneId = "home";
    game = initialGame();
  }
  history.replaceState(statePayload(), "", updateURL());
  render();
}

init();
