import json, re, subprocess

with open("all_issues_with_body.json") as f:
    issues = json.load(f)

def get_issue_state(num):
    try:
        out = subprocess.check_output(["gh", "issue", "view", str(num), "--json", "state,labels"])
        data = json.loads(out)
        labels = [l["name"] for l in data["labels"]]
        return data["state"], labels
    except:
        return "CLOSED", []

pending_tasks = []
for i in issues:
    if "task" not in [l["name"] for l in i["labels"]]:
        continue
    
    phase_match = re.search(r"phase:(\d+)", " ".join([l["name"] for l in i["labels"]]))
    phase = int(phase_match.group(1)) if phase_match else 999
    
    m = re.search(r"Blocked by (.*)", i["body"])
    blockers = []
    if m:
        blockers = re.findall(r"#(\d+)", m.group(1))
    
    unblocked = True
    for b in blockers:
        state, labels = get_issue_state(b)
        if state != "CLOSED" and "verify" not in labels:
            unblocked = False
            break
            
    if unblocked:
        pending_tasks.append((phase, i["number"], i["title"]))

pending_tasks.sort()
if pending_tasks:
    print(f"Next task: {pending_tasks[0]}")
else:
    print("No unblocked tasks found.")
