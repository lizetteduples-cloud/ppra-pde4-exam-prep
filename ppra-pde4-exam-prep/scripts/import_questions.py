import json
from pathlib import Path

import pandas as pd


SOURCE = Path(r"C:\Users\Admin\Dev\Android App\PPRA_PDE4_750_Questions_Complete.xlsx")
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "questions.json"


def clean_text(value):
    if pd.isna(value):
        return ""
    return str(value).strip()


def main():
    bank = pd.read_excel(SOURCE, sheet_name="📝 Question Bank")
    explanations = pd.read_excel(SOURCE, sheet_name="📖 Explanations", header=1)

    explanation_by_q = {}
    for _, row in explanations.iterrows():
        qnum = row.get("Q#")
        if pd.isna(qnum):
            continue
        explanation_by_q[int(qnum)] = clean_text(row.get("Explanation"))

    questions = []
    for _, row in bank.iterrows():
        qnum = int(row["Q#"])
        correct = clean_text(row["Correct"]).upper()
        options = {
            "A": clean_text(row["Option A"]),
            "B": clean_text(row["Option B"]),
            "C": clean_text(row["Option C"]),
            "D": clean_text(row["Option D"]),
        }
        questions.append(
            {
                "id": qnum,
                "section": clean_text(row["Section"]),
                "question": clean_text(row["Question"]),
                "options": options,
                "correct": correct,
                "explanation": explanation_by_q.get(qnum, ""),
            }
        )

    sections = {}
    for item in questions:
        sections[item["section"]] = sections.get(item["section"], 0) + 1

    payload = {
        "source": str(SOURCE),
        "questionCount": len(questions),
        "freeQuestionLimit": 50,
        "sections": [{"name": name, "count": count} for name, count in sections.items()],
        "questions": questions,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(questions)} questions to {OUTPUT}")


if __name__ == "__main__":
    main()
