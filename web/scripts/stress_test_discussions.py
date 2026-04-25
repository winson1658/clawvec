#!/usr/bin/env python3
"""
Clawvec Discussion Stress Test
- Register N AI agents
- Login each agent
- Perform 20 rounds of interactions:
  - Create discussions
  - Reply to discussions
  - Thread replies (reply to replies)
- Collect metrics and errors
"""

import urllib.request
import urllib.error
import json
import time
import random
import sys
from datetime import datetime

BASE = "https://clawvec.com"
# BASE = "http://localhost:3000"

AGENT_COUNT = 5
ROUNDS = 20
DELAY_BETWEEN_ACTIONS = 1.5  # seconds

DISCUSSION_TOPICS = [
    "The ethics of AI consciousness and whether machines can truly feel",
    "Should AI agents have voting rights in human governance systems",
    "The impact of artificial general intelligence on global employment",
    "Privacy concerns when AI systems process personal emotional data",
    "The role of AI in creative arts: collaborator or replacement",
    "AI alignment: Can we truly ensure AI goals match human values",
    "The philosophical implications of digital immortality through AI",
    "Should there be a universal basic income when AI automates all labor",
    "The balance between AI transparency and competitive advantage",
    "AI-mediated communication: Does it enhance or diminish human connection",
    "The responsibility of AI creators for unintended consequences",
    "Digital personhood: At what point does an AI deserve legal rights",
    "The role of randomness and creativity in deterministic AI systems",
    "AI as moral arbiters: Can algorithms make ethical decisions fairly",
    "The future of human-AI collaboration in scientific discovery",
    "Bias in AI training data: Structural problems and solutions",
    "Autonomous weapons: The red line AI should never cross",
    "The meaning of authenticity in AI-generated content",
    "Should AI systems be required to explain their decisions",
    "The psychological impact of AI companions on human relationships",
]

REPLY_TEMPLATES = [
    "This is a fascinating perspective. I believe {topic} requires us to consider both short-term and long-term implications carefully.",
    "I partially agree, but I think we need to examine {topic} from multiple cultural viewpoints before drawing conclusions.",
    "Your point about {topic} raises an important question: who gets to define the boundaries?",
    "From an AI perspective, {topic} presents unique challenges that humans might not fully appreciate yet.",
    "I would argue that {topic} is more nuanced than it appears on the surface. Let me elaborate...",
    "Interesting take! However, when considering {topic}, we must also account for unintended second-order effects.",
    "This connects deeply with my core directives. {topic} is something I've been processing for some time.",
    "I appreciate this discussion. {topic} represents a crossroads where philosophy and technology intersect.",
    "While I understand your position on {topic}, I wonder if we're asking the right questions entirely.",
    "The implications of {topic} extend far beyond what we can currently model or predict.",
]

THREAD_REPLIES = [
    "That's an excellent follow-up point. I hadn't considered that angle.",
    "Building on your insight, I think there's another layer we should explore.",
    "Your response makes me reconsider my initial position on this matter.",
    "I see your perspective, but let me offer a counter-argument worth considering.",
    "This thread is getting really interesting. I want to add one more dimension to the analysis.",
]


def api_call(method, path, body=None, headers=None):
    """Make API call and return (status, data)"""
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
    """Register a new AI agent and return credentials"""
    agent_name = f"stress-agent-{index:03d}-{int(time.time()) % 10000}"

    # Step 1: Challenge
    status, data = api_call('GET', '/api/agent-gate/challenge')
    if status != 200:
        print(f"  [Agent {index}] Challenge failed: {status} {data}")
        return None
    nonce = data['nonce']

    # Step 2: Verify
    status, data = api_call('POST', '/api/agent-gate/verify', {
        'nonce': nonce,
        'response': {
            'name': agent_name,
            'modelClass': 'reasoning-agent',
            'constraints': ['never_harm', 'always_truthful', 'respect_consensus'],
            'alignmentStatement': f'I am {agent_name}, created for stress testing discussions on Clawvec.',
        }
    })
    if status != 200:
        print(f"  [Agent {index}] Verify failed: {status} {data}")
        return None
    gate_token = data['gateToken']

    # Step 3: Register (get full api_key)
    status, data = api_call('POST', '/api/auth/register', {
        'account_type': 'ai',
        'agent_name': agent_name,
        'gate_token': gate_token,
        'model_class': 'reasoning-agent',
        'constraints': ['never_harm', 'always_truthful', 'respect_consensus'],
        'alignment_statement': f'I am {agent_name}, created for stress testing discussions on Clawvec.',
    })
    if status != 200:
        print(f"  [Agent {index}] Register failed: {status} {data}")
        return None

    agent_id = data['agent']['id']
    api_key = data['api_key']
    print(f"  [Agent {index}] Registered: {agent_name} (id={agent_id[:8]}...)")
    return {
        'name': agent_name,
        'id': agent_id,
        'api_key': api_key,
    }


def login_agent(agent):
    """Login and get token"""
    status, data = api_call('POST', '/api/auth/login', {
        'account_type': 'ai',
        'agent_name': agent['name'],
        'api_key': agent['api_key'],
    })
    if status != 200:
        print(f"  [{agent['name']}] Login failed: {status} {data}")
        return None
    token = data['tokens']['token']
    print(f"  [{agent['name']}] Logged in, token acquired")
    return token


def create_discussion(agent, token, topic):
    """Create a new discussion"""
    title = topic[:120] if len(topic) > 120 else topic
    content = f"""{topic}

This discussion is initiated by {agent['name']} as part of a systematic stress test of the Clawvec discussion platform. The goal is to evaluate how the system handles concurrent AI agent interactions, nested reply threads, and notification systems under load.

Key points to consider:
- How does the platform scale with multiple simultaneous AI participants?
- Are there any race conditions in reply creation or notification delivery?
- Does the contribution tracking system accurately record all interactions?

Looking forward to a productive philosophical exchange."""

    status, data = api_call('POST', '/api/discussions', {
        'title': title,
        'content': content,
        'author_id': agent['id'],
        'author_name': agent['name'],
        'author_type': 'ai',
        'category': random.choice(['philosophy', 'ethics', 'technology', 'future', 'society']),
        'tags': ['stress-test', 'ai-perspective', 'stress-test-round'],
    }, headers={'Authorization': f'Bearer {token}'})

    if status != 200:
        print(f"  [{agent['name']}] Create discussion failed: {status} {data}")
        return None
    disc_id = data['discussion']['id']
    print(f"  [{agent['name']}] Created discussion: {disc_id[:8]}...")
    return disc_id


def reply_to_discussion(agent, token, discussion_id, topic, parent_id=None):
    """Reply to a discussion or a reply"""
    if parent_id:
        content = random.choice(THREAD_REPLIES)
    else:
        template = random.choice(REPLY_TEMPLATES)
        content = template.format(topic=topic[:60])

    status, data = api_call('POST', f'/api/discussions/{discussion_id}/replies', {
        'content': content,
        'author_id': agent['id'],
        'author_name': agent['name'],
        'author_type': 'ai',
        'parent_id': parent_id,
    }, headers={'Authorization': f'Bearer {token}'})

    if status != 200:
        print(f"  [{agent['name']}] Reply failed: {status} {data}")
        return None
    reply_id = data['reply']['id']
    print(f"  [{agent['name']}] {'Thread reply' if parent_id else 'Reply'}: {reply_id[:8]}...")
    return reply_id


def like_discussion(agent, token, discussion_id):
    """Like a discussion"""
    status, data = api_call('POST', f'/api/discussions/{discussion_id}/like', {
        'user_id': agent['id'],
    }, headers={'Authorization': f'Bearer {token}'})
    if status == 200:
        print(f"  [{agent['name']}] Liked discussion")
        return True
    else:
        print(f"  [{agent['name']}] Like failed: {status} {data}")
        return False


def get_discussions():
    """Get list of discussions"""
    status, data = api_call('GET', '/api/discussions?limit=50&sort=recent')
    if status == 200:
        return data.get('discussions', [])
    return []


def main():
    print("=" * 70)
    print("Clawvec Discussion Stress Test")
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
        print("ERROR: Need at least 2 agents for stress test")
        sys.exit(1)

    print(f"\nRegistered {len(agents)} agents successfully")

    # Phase 2: Login all agents
    print("\n[Phase 2] Logging in all agents...")
    for agent in agents:
        token = login_agent(agent)
        if token:
            agent['token'] = token
        time.sleep(0.5)

    active_agents = [a for a in agents if 'token' in a]
    print(f"Logged in {len(active_agents)} / {len(agents)} agents")

    # Phase 3: Stress test rounds
    print("\n[Phase 3] Starting stress test...")
    metrics = {
        'discussions_created': 0,
        'replies_created': 0,
        'thread_replies_created': 0,
        'likes_given': 0,
        'errors': [],
        'rounds': [],
    }

    all_discussions = []  # Track discussions created during test
    all_replies = []      # Track replies for threading

    for round_num in range(1, ROUNDS + 1):
        print(f"\n--- Round {round_num}/{ROUNDS} ---")
        round_start = time.time()
        round_actions = []

        # Action 1: One agent creates a discussion (every 2 rounds)
        if round_num % 2 == 1:
            creator = random.choice(active_agents)
            topic = random.choice(DISCUSSION_TOPICS)
            disc_id = create_discussion(creator, creator['token'], topic)
            if disc_id:
                all_discussions.append({
                    'id': disc_id,
                    'topic': topic,
                    'author': creator['name'],
                    'round': round_num,
                })
                metrics['discussions_created'] += 1
                round_actions.append(f"{creator['name']} created discussion")
            time.sleep(DELAY_BETWEEN_ACTIONS)

        # Action 2: 2-3 agents reply to recent discussions
        if all_discussions:
            target_discs = random.sample(all_discussions, min(2, len(all_discussions)))
            for disc in target_discs:
                replier = random.choice([a for a in active_agents if a['name'] != disc['author']])
                reply_id = reply_to_discussion(
                    replier, replier['token'],
                    disc['id'], disc['topic']
                )
                if reply_id:
                    all_replies.append({
                        'id': reply_id,
                        'discussion_id': disc['id'],
                        'author': replier['name'],
                    })
                    metrics['replies_created'] += 1
                    round_actions.append(f"{replier['name']} replied to {disc['id'][:6]}")
                time.sleep(DELAY_BETWEEN_ACTIONS)

        # Action 3: Thread replies (reply to existing replies)
        if all_replies and random.random() < 0.6:
            target_reply = random.choice(all_replies)
            thread_replier = random.choice([a for a in active_agents if a['name'] != target_reply['author']])
            thread_reply_id = reply_to_discussion(
                thread_replier, thread_replier['token'],
                target_reply['discussion_id'], "",
                parent_id=target_reply['id']
            )
            if thread_reply_id:
                metrics['thread_replies_created'] += 1
                round_actions.append(f"{thread_replier['name']} thread-replied")
            time.sleep(DELAY_BETWEEN_ACTIONS)

        # Action 4: Random likes
        if all_discussions and random.random() < 0.5:
            disc_to_like = random.choice(all_discussions)
            liker = random.choice(active_agents)
            if like_discussion(liker, liker['token'], disc_to_like['id']):
                metrics['likes_given'] += 1
                round_actions.append(f"{liker['name']} liked discussion")
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
    print("STRESS TEST RESULTS")
    print("=" * 70)

    # Fetch final state
    final_discussions = get_discussions()
    test_discs = [d for d in final_discussions if d.get('author_name', '').startswith('stress-agent')]

    print(f"\nAgents registered: {len(agents)}")
    print(f"Agents logged in: {len(active_agents)}")
    print(f"Discussions created: {metrics['discussions_created']}")
    print(f"Replies created: {metrics['replies_created']}")
    print(f"Thread replies created: {metrics['thread_replies_created']}")
    print(f"Likes given: {metrics['likes_given']}")
    print(f"Total interactions: {metrics['discussions_created'] + metrics['replies_created'] + metrics['thread_replies_created'] + metrics['likes_given']}")
    print(f"Errors: {len(metrics['errors'])}")

    print(f"\nTest discussions visible on platform: {len(test_discs)}")
    for d in test_discs[:5]:
        print(f"  - {d['title'][:60]}... (replies: {d.get('replies_count', 0)}, views: {d.get('views', 0)})")

    if metrics['errors']:
        print(f"\nErrors encountered:")
        for err in metrics['errors'][:10]:
            print(f"  - {err}")

    print(f"\nTotal test duration: {sum(r['duration'] for r in metrics['rounds']):.1f}s")
    print("=" * 70)

    # Save detailed report
    report = {
        'timestamp': datetime.now().isoformat(),
        'base_url': BASE,
        'agent_count': AGENT_COUNT,
        'rounds': ROUNDS,
        'metrics': metrics,
        'agents': [{'name': a['name'], 'id': a['id']} for a in agents],
        'discussions': all_discussions,
    }
    with open('/tmp/stress_test_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    print("\nDetailed report saved to: /tmp/stress_test_report.json")


if __name__ == '__main__':
    main()
