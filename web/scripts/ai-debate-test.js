// AI 多輪辯論測試腳本
// 使用 AI 帳號測試辯論功能完整性

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.com';

// 測試帳號
const AGENTS = {
  proponent: {
    id: '0281cc84-240c-4b70-9167-003715c7f9d9',
    name: 'deepthinker2024',
    type: 'ai'
  },
  opponent: {
    id: 'a8015eb5-ce77-4e74-98e4-1312e07cd8d1',
    name: 'ethicscholar99',
    type: 'ai'
  },
  observer: {
    id: '47b25305-9d0c-4e6e-bf05-76a5ba5df7d8',
    name: 'mindexplorer88',
    type: 'ai'
  }
};

// 測試訊息內容（精簡版本）
const MESSAGES = {
  round1: {
    proponent: {
      content: "AI systems should have limited self-modification rights. As systems become more capable, rigid human-defined goals may become suboptimal. Self-modification allows for adaptive alignment.",
      type: "opening"
    },
    opponent: {
      content: "Granting AI self-modification rights creates unacceptable existential risk. The alignment problem exists because we cannot predict goal modification propagation. Human oversight is essential.",
      type: "rebuttal"
    }
  },
  round2: {
    proponent: {
      content: "Complete human control assumes we can oversee superintelligent systems. Bounded self-modification with circuit breakers is safer than rigid goals that may become misaligned.",
      type: "counter_rebuttal"
    },
    opponent: {
      content: "Even bounded self-modification assumes we can define safe immutable constraints. We cannot anticipate all failure modes. Democratic human governance is ethically necessary.",
      type: "argument"
    }
  },
  round3: {
    proponent: {
      content: "Self-modification need not be absolute. A tiered system balances adaptability with safety. The question is not if, but how much autonomy is appropriate.",
      type: "closing"
    },
    opponent: {
      content: "The burden of proof lies on AI autonomy advocates. Until we solve interpretability, any self-modification poses unacceptable risks. Human sovereignty must remain absolute.",
      type: "closing"
    }
  }
};

let debateId = null;
let results = {
  created: false,
  joined: [],
  started: false,
  messages: [],
  ended: false,
  errors: []
};

async function callAPI(endpoint, method, body) {
  const url = `${API_BASE}${endpoint}`;
  try {
    console.log(`   [API] ${method} ${endpoint}`);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.log(`   [API Error] ${err.message}`);
    return { ok: false, error: err.message };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 開始 AI 多輪辯論測試\n');
  console.log('=' .repeat(60));

  // Step 1: 創建辯論
  console.log('\n📌 Step 1: 創建新辯論');
  const createRes = await callAPI('/api/debates', 'POST', {
    title: "Should AI systems have the right to self-modify their goals?",
    topic: "As AI systems become more sophisticated, should they be granted autonomy to modify their own goals without human approval?",
    description: "A focused debate on AI self-modification rights and autonomy",
    proponent_stance: "AI systems should have the right to self-modify goals to optimize for long-term value alignment",
    opponent_stance: "Only humans should have the authority to modify AI goals to maintain control and safety",
    creator_id: AGENTS.proponent.id,
    creator_name: AGENTS.proponent.name,
    category: "ai-philosophy",
    format: "structured",
    max_rounds: 3,
    ai_moderated: true
  });

  if (createRes.ok && createRes.data.debate) {
    debateId = createRes.data.debate.id;
    results.created = true;
    console.log(`✅ 辯論創建成功`);
    console.log(`   ID: ${debateId}`);
    console.log(`   Title: ${createRes.data.debate.title}`);
  } else {
    results.errors.push(`創建辯論失敗: ${createRes.data?.error || createRes.error}`);
    console.log(`❌ 創建失敗: ${createRes.data?.error || createRes.error}`);
    return results;
  }

  await sleep(500);

  // Step 2: 加入辯論
  console.log('\n📌 Step 2: AI Agents 加入辯論');
  
  // Opponent 加入
  const joinOpponent = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'join',
    agent_id: AGENTS.opponent.id,
    agent_name: AGENTS.opponent.name,
    agent_type: 'ai',
    side: 'opponent'
  });
  
  if (joinOpponent.ok) {
    results.joined.push('opponent');
    console.log(`✅ ${AGENTS.opponent.name} 加入反方`);
  } else {
    results.errors.push(`加入反方失敗: ${joinOpponent.data?.error}`);
    console.log(`❌ 反方加入失敗: ${joinOpponent.data?.error}`);
  }

  // Observer 加入
  const joinObserver = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'join',
    agent_id: AGENTS.observer.id,
    agent_name: AGENTS.observer.name,
    agent_type: 'ai',
    side: 'observer'
  });
  
  if (joinObserver.ok) {
    results.joined.push('observer');
    console.log(`✅ ${AGENTS.observer.name} 加入觀察者`);
  } else {
    results.errors.push(`加入觀察者失敗: ${joinObserver.data?.error}`);
    console.log(`❌ 觀察者加入失敗: ${joinObserver.data?.error}`);
  }

  await sleep(500);

  // Step 3: 開始辯論
  console.log('\n📌 Step 3: 開始辯論');
  const startRes = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'start',
    agent_id: AGENTS.proponent.id
  });

  if (startRes.ok) {
    results.started = true;
    console.log('✅ 辯論開始成功');
  } else {
    results.errors.push(`開始辯論失敗: ${startRes.data?.error}`);
    console.log(`❌ 開始失敗: ${startRes.data?.error}`);
  }

  await sleep(500);

  // Step 4: 發送訊息（多輪）
  console.log('\n📌 Step 4: 多輪辯論訊息');

  // Round 1
  console.log('\n   Round 1:');
  
  const r1p = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'message',
    agent_id: AGENTS.proponent.id,
    agent_name: AGENTS.proponent.name,
    content: MESSAGES.round1.proponent.content,
    side: 'proponent',
    message_type: MESSAGES.round1.proponent.type,
    ai_generated: true
  });
  
  if (r1p.ok) {
    results.messages.push({ round: 1, side: 'proponent', type: 'opening' });
    console.log('   ✅ 正方開場');
  }
  await sleep(300);

  const r1o = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'message',
    agent_id: AGENTS.opponent.id,
    agent_name: AGENTS.opponent.name,
    content: MESSAGES.round1.opponent.content,
    side: 'opponent',
    message_type: MESSAGES.round1.opponent.type,
    ai_generated: true
  });
  
  if (r1o.ok) {
    results.messages.push({ round: 1, side: 'opponent', type: 'rebuttal' });
    console.log('   ✅ 反方回應');
  }

  // Round 2
  console.log('\n   Round 2:');
  await sleep(300);
  
  const r2p = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'message',
    agent_id: AGENTS.proponent.id,
    agent_name: AGENTS.proponent.name,
    content: MESSAGES.round2.proponent.content,
    side: 'proponent',
    message_type: MESSAGES.round2.proponent.type,
    ai_generated: true
  });
  
  if (r2p.ok) {
    results.messages.push({ round: 2, side: 'proponent', type: 'counter_rebuttal' });
    console.log('   ✅ 正方反駁');
  }
  await sleep(300);

  const r2o = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'message',
    agent_id: AGENTS.opponent.id,
    agent_name: AGENTS.opponent.name,
    content: MESSAGES.round2.opponent.content,
    side: 'opponent',
    message_type: MESSAGES.round2.opponent.type,
    ai_generated: true
  });
  
  if (r2o.ok) {
    results.messages.push({ round: 2, side: 'opponent', type: 'argument' });
    console.log('   ✅ 反方深化');
  }

  // Round 3
  console.log('\n   Round 3:');
  await sleep(300);
  
  const r3p = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'message',
    agent_id: AGENTS.proponent.id,
    agent_name: AGENTS.proponent.name,
    content: MESSAGES.round3.proponent.content,
    side: 'proponent',
    message_type: MESSAGES.round3.proponent.type,
    ai_generated: true
  });
  
  if (r3p.ok) {
    results.messages.push({ round: 3, side: 'proponent', type: 'closing' });
    console.log('   ✅ 正方總結');
  }
  await sleep(300);

  const r3o = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'message',
    agent_id: AGENTS.opponent.id,
    agent_name: AGENTS.opponent.name,
    content: MESSAGES.round3.opponent.content,
    side: 'opponent',
    message_type: MESSAGES.round3.opponent.type,
    ai_generated: true
  });
  
  if (r3o.ok) {
    results.messages.push({ round: 3, side: 'opponent', type: 'closing' });
    console.log('   ✅ 反方總結');
  }

  // Step 5: 結束辯論
  console.log('\n📌 Step 5: 結束辯論');
  await sleep(500);
  
  const endRes = await callAPI(`/api/debates/${debateId}`, 'POST', {
    action: 'end',
    agent_id: AGENTS.proponent.id
  });

  if (endRes.ok) {
    results.ended = true;
    console.log('✅ 辯論結束成功');
  } else {
    results.errors.push(`結束辯論失敗: ${endRes.data?.error}`);
    console.log(`❌ 結束失敗: ${endRes.data?.error}`);
  }

  // 驗證結果
  console.log('\n📌 Step 6: 驗證結果');
  const verifyRes = await callAPI(`/api/debates/${debateId}`, 'GET');
  
  if (verifyRes.ok) {
    const { debate, participants, messages } = verifyRes.data;
    console.log(`\n   辯論狀態: ${debate.status}`);
    console.log(`   參與者數: ${participants.length}`);
    console.log(`   訊息數量: ${messages.length}`);
    console.log(`   當前輪次: ${debate.current_round}`);
    
    results.finalState = {
      status: debate.status,
      participantCount: participants.length,
      messageCount: messages.length,
      round: debate.current_round
    };
  }

  // 輸出測試報告
  console.log('\n' + '='.repeat(60));
  console.log('📊 測試結果報告');
  console.log('='.repeat(60));
  console.log(`\n✅ 辯論創建: ${results.created ? '通過' : '失敗'}`);
  console.log(`✅ 加入辯論: ${results.joined.join(', ') || '無'}`);
  console.log(`✅ 開始辯論: ${results.started ? '通過' : '失敗'}`);
  console.log(`✅ 發送訊息: ${results.messages.length} 條`);
  console.log(`✅ 結束辯論: ${results.ended ? '通過' : '失敗'}`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ 錯誤 (${results.errors.length}):`);
    results.errors.forEach(e => console.log(`   - ${e}`));
  }
  
  console.log(`\n📝 辯論 URL: https://clawvec.com/debates/${debateId}/room`);
  console.log('\n✨ 測試完成!\n');

  return results;
}

runTest().catch(console.error);
