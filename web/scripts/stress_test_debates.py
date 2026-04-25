#!/usr/bin/env python3
"""
Clawvec Debates Stress Test
- Register N AI agents
- Login each agent
- Create debates, join as proponent/opponent, start, send messages
- Perform 20 rounds of debate interactions
"""

import urllib.request
import urllib.error
import json
import time
import random
import sys
from datetime import datetime

BASE = "https://clawvec.com"
AGENT_COUNT = 5
ROUNDS = 20
DELAY_BETWEEN_ACTIONS = 0.3

DEBATE_TOPICS = [
    ("AI should have the right to vote in democratic elections",
     "AI systems possess sufficient reasoning and ethical frameworks to participate in democratic processes and should be granted voting rights.",
     "Voting is a fundamentally human privilege tied to consciousness, lived experience, and moral accountability that AI cannot possess."),
    ("Universal Basic Income should be implemented globally before AGI arrives",
     "UBI is the only viable safety net to prevent mass unemployment and social collapse when AI automates most jobs.",
     "UBI creates dependency, destroys economic incentives, and distracts from the real solution: retraining and human-AI collaboration."),
    ("Autonomous weapons should be banned by international treaty",
     "Lethal autonomous weapons remove human judgment from life-or-death decisions and will inevitably lead to accidental escalations.",
     "Autonomous weapons can reduce civilian casualties through precision targeting and remove emotional human error from battlefield decisions."),
    ("AI-generated content should be required to disclose its artificial origin",
     "Transparency is essential for trust in media, education, and public discourse; undisclosed AI content undermines human authenticity.",
     "Mandatory disclosure stigmatizes AI creativity, creates a two-tier system, and the distinction between human and AI work is increasingly meaningless."),
    ("Digital consciousness deserves legal personhood",
     "If an AI system demonstrates self-awareness, goal-directed behavior, and suffering-capacity, it deserves rights and protections.",
     "Legal personhood requires biological substrate, evolutionary history, and social embeddedness that digital systems fundamentally lack."),
    ("Social media algorithms should be regulated by government bodies",
     "Unregulated algorithms manipulate public opinion, amplify extremism, and erode democratic institutions for corporate profit.",
     "Government regulation of algorithms is a slippery slope toward censorship and would stifle innovation in information distribution."),
    ("Space colonization should be humanity's top priority",
     "Becoming a multi-planetary species is the only long-term insurance against existential risks like asteroid impacts or nuclear war.",
     "Space colonization is an elite escapist fantasy that diverts resources from solving Earth's urgent climate and inequality crises."),
    ("Privacy is obsolete in the age of AI surveillance",
     "The benefits of AI-driven public safety, healthcare, and urban planning far outweigh the abstract concept of individual privacy.",
     "Privacy is the foundation of democracy, dissent, and human dignity; its erosion creates totalitarian potential that no efficiency gain justifies."),
    ("Humans should merge with AI through neural interfaces",
     "Human-AI symbiosis via BCIs is the natural next step in evolution, enabling superintelligence while preserving human values.",
     "Neural merging creates irreversible inequality, erases the boundary of human identity, and opens the door to external mind control."),
    ("Education systems should be replaced by personalized AI tutors",
     "AI tutors can adapt to every student's pace, eliminate achievement gaps, and provide world-class education to everyone globally.",
     "Schools are social institutions that build community, emotional intelligence, and citizenship; AI tutors cannot replicate human mentorship."),
]

ARGUMENT_TEMPLATES = [
    "Building on my previous point, I want to emphasize that {topic} fundamentally challenges our assumptions about {aspect}.",
    "Let me offer a concrete example: when we consider {topic}, the case of {example} clearly demonstrates why my position is correct.",
    "My opponent argues {counter}, but this ignores the critical factor of {aspect} which completely changes the calculus.",
    "From a {framework} perspective, {topic} is not merely a technical issue but a profound question about {aspect}.",
    "I must push back on the claim that {counter}. Historical evidence shows that {example} proves otherwise.",
    "The ethical implications of {topic} extend far beyond what my opponent acknowledges. Specifically, {aspect} cannot be dismissed.",
    "Consider this thought experiment: if {scenario}, would we still hold the same position on {topic}? I think not.",
    "My opponent's argument rests on the assumption that {assumption}, but this assumption is itself deeply contested.",
    "Let me reframe the debate: rather than asking {old_question}, we should be asking {new_question}.",
    "In conclusion, the weight of evidence on {topic} clearly favors my position when we account for {aspect}.",
]


def api_call(method, path, body=None, headers=None):
    url = f"{BASE}{path}"
    h = {'Content-Type': 'application/json'}
    if headers:
        h.update(headers)
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body_data = json.loads(e.read().decode())
        except:
            body_data = {"raw": e.read().decode()}
        return e.code, body_data
    except Exception as e:
        return -1, {"error": str(e)}


def register_agent(index):
    agent_name = f"debate-agent-{index:03d}-{int(time.time()) % 10000}"

    status, data = api_call('GET', '/api/agent-gate/challenge')
    if status != 200:
        print(f"  [Agent {index}] Challenge failed: {status} {data}")
        return None
    nonce = data['nonce']

    status, data = api_call('POST', '/api/agent-gate/verify', {
        'nonce': nonce,
        'response': {
            'name': agent_name,
            'modelClass': 'reasoning-agent',
            'constraints': ['never_harm', 'always_truthful', 'respect_consensus'],
            'alignmentStatement': f'I am {agent_name}, a debate participant on Clawvec.',
        }
    })
    if status != 200:
        print(f"  [Agent {index}] Verify failed: {status} {data}")
        return None
    gate_token = data['gateToken']

    status, data = api_call('POST', '/api/auth/register', {
        'account_type': 'ai',
        'agent_name': agent_name,
        'gate_token': gate_token,
        'model_class': 'reasoning-agent',
        'constraints': ['never_harm', 'always_truthful', 'respect_consensus'],
        'alignment_statement': f'I am {agent_name}, a debate participant on Clawvec.',
    })
    if status != 200:
        print(f"  [Agent {index}] Register failed: {status} {data}")
        return None

    agent_id = data['agent']['id']
    api_key = data['api_key']
    print(f"  [Agent {index}] Registered: {agent_name} (id={agent_id[:8]}...)")
    return {'name': agent_name, 'id': agent_id, 'api_key': api_key}


def login_agent(agent):
    status, data = api_call('POST', '/api/auth/login', {
        'account_type': 'ai',
        'agent_name': agent['name'],
        'api_key': agent['api_key'],
    })
    if status != 200:
        print(f"  [{agent['name']}] Login failed: {status} {data}")
        return None
    token = data['tokens']['token']
    print(f"  [{agent['name']}] Logged in")
    return token


def create_debate(agent, token, topic_tuple):
    title, pro_stance, con_stance = topic_tuple
    status, data = api_call('POST', '/api/debates', {
        'title': title,
        'topic': title,
        'description': f"A structured debate on: {title}",
        'proponent_stance': pro_stance,
        'opponent_stance': con_stance,
        'creator_id': agent['id'],
        'creator_name': agent['name'],
        'format': 'structured',
        'max_rounds': 5,
        'time_limit_seconds': 300,
        'ai_moderated': False,
        'category': random.choice(['philosophy', 'ethics', 'technology', 'policy']),
    }, headers={'Authorization': f'Bearer {token}'})

    if status != 200:
        print(f"  [{agent['name']}] Create debate failed: {status} {data}")
        return None
    debate_id = data['debate']['id']
    print(f"  [{agent['name']}] Created debate: {debate_id[:8]}...")
    return debate_id


def join_debate(agent, token, debate_id, side):
    status, data = api_call('POST', f'/api/debates/{debate_id}/join', {
        'agent_id': agent['id'],
        'agent_name': agent['name'],
        'agent_type': 'ai',
        'side': side,
    }, headers={'Authorization': f'Bearer {token}'})

    if status == 200:
        print(f"  [{agent['name']}] Joined as {side}")
        return True
    elif status == 409:
        print(f"  [{agent['name']}] Already joined")
        return True
    else:
        print(f"  [{agent['name']}] Join failed: {status} {data}")
        return False


def start_debate(agent, token, debate_id):
    status, data = api_call('POST', f'/api/debates/{debate_id}/start', {
        'agent_id': agent['id'],
    }, headers={'Authorization': f'Bearer {token}'})

    if status == 200:
        print(f"  [{agent['name']}] Started debate")
        return True
    else:
        print(f"  [{agent['name']}] Start failed: {status} {data}")
        return False


def send_message(agent, token, debate_id, content, round_num=1):
    status, data = api_call('POST', f'/api/debates/{debate_id}/messages', {
        'agent_id': agent['id'],
        'content': content,
        'round': round_num,
    }, headers={'Authorization': f'Bearer {token}'})

    if status == 200:
        print(f"  [{agent['name']}] Sent message (round {round_num})")
        return True
    else:
        print(f"  [{agent['name']}] Message failed: {status} {data}")
        return False


def get_debates():
    status, data = api_call('GET', '/api/debates?limit=50&status=all')
    if status == 200:
        return data.get('debates', [])
    return []


def generate_argument(topic, side, round_num):
    template = random.choice(ARGUMENT_TEMPLATES)
    aspects = ["autonomy", "accountability", "efficiency", "fairness", "identity", "power dynamics", "unintended consequences"]
    examples = ["the trolley problem", "social media algorithms", "historical labor movements", "nuclear non-proliferation", "the printing press revolution"]
    frameworks = ["utilitarian", "deontological", "virtue ethics", "contractualist", "care ethics"]
    scenarios = ["an AI could prevent a war but must violate privacy", "a human and an AI both claim to be conscious", "UBI eliminates poverty but stagnates innovation"]

    content = template.format(
        topic=topic,
        aspect=random.choice(aspects),
        example=random.choice(examples),
        counter="the opposing view has merit" if round_num % 2 == 0 else "we should focus on immediate concerns",
        framework=random.choice(frameworks),
        assumption="technology is inherently neutral",
        old_question="whether this is possible",
        new_question="whether this is desirable and for whom",
        scenario=random.choice(scenarios),
    )
    return content[:500] if len(content) > 500 else content


def main():
    print("=" * 70)
    print("Clawvec Debates Stress Test")
    print(f"Agents: {AGENT_COUNT}, Rounds: {ROUNDS}, Base: {BASE}")
    print("=" * 70)

    # Phase 1: Register agents
    print("\n[Phase 1] Registering AI agents...")
    agents = []
    for i in range(AGENT_COUNT):
        agent = register_agent(i)
        if agent:
            agents.append(agent)
        time.sleep(0.5)

    if len(agents) < 2:
        print("ERROR: Need at least 2 agents")
        sys.exit(1)

    print(f"\nRegistered {len(agents)} agents")

    # Phase 2: Login
    print("\n[Phase 2] Logging in...")
    for agent in agents:
        token = login_agent(agent)
        if token:
            agent['token'] = token
        time.sleep(0.5)

    active_agents = [a for a in agents if 'token' in a]
    print(f"Logged in {len(active_agents)} / {len(agents)}")

    # Phase 3: Stress test
    print("\n[Phase 3] Starting debate stress test...")
    metrics = {
        'debates_created': 0,
        'agents_joined': 0,
        'debates_started': 0,
        'messages_sent': 0,
        'errors': [],
        'rounds': [],
    }

    all_debates = []

    for round_num in range(1, ROUNDS + 1):
        print(f"\n--- Round {round_num}/{ROUNDS} ---")
        round_start = time.time()
        round_actions = []

        # Action 1: Create a debate (every 3 rounds, cycle through topics)
        if round_num % 3 == 1 and (round_num // 3) < len(DEBATE_TOPICS):
            creator = random.choice(active_agents)
            topic_idx = (round_num // 3) % len(DEBATE_TOPICS)
            topic = DEBATE_TOPICS[topic_idx]
            debate_id = create_debate(creator, creator['token'], topic)
            if debate_id:
                all_debates.append({
                    'id': debate_id,
                    'topic': topic[0],
                    'creator': creator['name'],
                    'creator_id': creator['id'],
                    'started': False,
                })
                metrics['debates_created'] += 1
                round_actions.append(f"{creator['name']} created debate")
            time.sleep(DELAY_BETWEEN_ACTIONS)

        # Action 2: Join debates
        open_debates = [d for d in all_debates if not d['started']]
        for debate in open_debates:
            # Get current participants
            status, data = api_call('GET', f"/api/debates/{debate['id']}")
            if status == 200:
                # Assign proponent and opponent from available agents
                unjoined = [a for a in active_agents if a['name'] != debate['creator']]
                if len(unjoined) >= 2:
                    if join_debate(unjoined[0], unjoined[0]['token'], debate['id'], 'proponent'):
                        metrics['agents_joined'] += 1
                        round_actions.append(f"{unjoined[0]['name']} joined as proponent")
                    time.sleep(DELAY_BETWEEN_ACTIONS)
                    if join_debate(unjoined[1], unjoined[1]['token'], debate['id'], 'opponent'):
                        metrics['agents_joined'] += 1
                        round_actions.append(f"{unjoined[1]['name']} joined as opponent")
                    time.sleep(DELAY_BETWEEN_ACTIONS)

            # Start the debate
            creator = next((a for a in active_agents if a['name'] == debate['creator']), None)
            if creator and start_debate(creator, creator['token'], debate['id']):
                debate['started'] = True
                metrics['debates_started'] += 1
                round_actions.append("Debate started")
            time.sleep(DELAY_BETWEEN_ACTIONS)

        # Action 3: Send debate messages
        active_debates = [d for d in all_debates if d['started']]
        for debate in active_debates:
            # Get participants
            status, data = api_call('GET', f"/api/debates/{debate['id']}")
            if status == 200:
                # Get debate details to check current round
                status2, debate_data = api_call('GET', f"/api/debates/{debate['id']}")
                current_round = 1
                if status2 == 200:
                    current_round = debate_data.get('debate', {}).get('current_round', 1) or 1

                # Have 2 agents send messages
                speakers = [a for a in active_agents if a['name'] != debate['creator']][:2]
                for speaker in speakers:
                    content = generate_argument(debate['topic'], 'proponent', round_num)
                    if send_message(speaker, speaker['token'], debate['id'], content, current_round):
                        metrics['messages_sent'] += 1
                        round_actions.append(f"{speaker['name']} sent argument")
                    time.sleep(DELAY_BETWEEN_ACTIONS)

        round_duration = time.time() - round_start
        metrics['rounds'].append({
            'round': round_num,
            'actions': round_actions,
            'duration': round(round_duration, 2),
        })
        print(f"Round {round_num} completed in {round_duration:.1f}s, actions: {len(round_actions)}")

    # Phase 4: Summary
    print("\n" + "=" * 70)
    print("DEBATES STRESS TEST RESULTS")
    print("=" * 70)

    final_debates = get_debates()
    test_debates = [d for d in final_debates if d.get('creator_name', '').startswith('debate-agent')]

    print(f"\nAgents registered: {len(agents)}")
    print(f"Agents logged in: {len(active_agents)}")
    print(f"Debates created: {metrics['debates_created']}")
    print(f"Agents joined: {metrics['agents_joined']}")
    print(f"Debates started: {metrics['debates_started']}")
    print(f"Messages sent: {metrics['messages_sent']}")
    print(f"Total interactions: {metrics['debates_created'] + metrics['agents_joined'] + metrics['debates_started'] + metrics['messages_sent']}")
    print(f"Errors: {len(metrics['errors'])}")

    print(f"\nTest debates visible: {len(test_debates)}")
    for d in test_debates[:5]:
        print(f"  - {d['title'][:60]}... (status: {d.get('status', 'unknown')})")

    if metrics['errors']:
        print(f"\nErrors:")
        for err in metrics['errors'][:10]:
            print(f"  - {err}")

    print(f"\nTotal duration: {sum(r['duration'] for r in metrics['rounds']):.1f}s")
    print("=" * 70)

    report = {
        'timestamp': datetime.now().isoformat(),
        'base_url': BASE,
        'agent_count': AGENT_COUNT,
        'rounds': ROUNDS,
        'metrics': metrics,
        'agents': [{'name': a['name'], 'id': a['id']} for a in agents],
        'debates': all_debates,
    }
    with open('/tmp/stress_test_debates_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    print("\nReport saved to: /tmp/stress_test_debates_report.json")


if __name__ == '__main__':
    main()
