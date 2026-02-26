import argparse
import datetime
import json
import os

# Version: read from repo root VERSION file (single source of truth)
def _get_version():
    root = os.path.dirname(os.path.abspath(__file__))
    version_file = os.path.join(root, "VERSION")
    if os.path.exists(version_file):
        with open(version_file, encoding="utf-8") as f:
            return f.read().strip()
    return "0.0.0"

__version__ = _get_version()

# Configuration
PUPPY_NAME = "Fimme"
BIRTHDATE = datetime.date(2025, 12, 26)
ARRIVAL_DATE = datetime.date(2026, 2, 21)  # First day with us
END_DATE = BIRTHDATE + datetime.timedelta(weeks=52)   # Through first birthday

# Fact library in English (default fallback)
FACTS_EN = [
    "Stabyhoun Fact: The name 'Stabyhoun' roughly translates from Frisian to 'Stand by me dog'.",
    "Stabyhoun Fact: They are one of the top 5 rarest dog breeds in the world.",
    "Breed Fact: Stabyhouns originate from the province of Friesland in the Netherlands.",
    "Breed Fact: Historically, they were the 'poor man's dog', capable of hunting, guarding, and catching moles.",
    "Breed Fact: Stabyhouns are known for having a 'soft mouth', meaning they can retrieve game without damaging it.",
    "Breed Fact: Unlike many hunting breeds, the Stabyhoun is known to be an independent thinker and can be stubborn.",
    "Development: At 8 weeks, puppies are in a 'fear imprint' stage. Positive experiences are crucial right now.",
    "Health: A puppy's growth plates are soft and don't close until 12-18 months. This is why we limit walking time.",
    "Fun Fact: Stabyhouns love water! They were often used to retrieve ducks.",
    "Grooming: The Stabyhoun is 'self-cleaning'. Dirt usually falls off their coat once it dries.",
    "Breed Fact: The tips of a Stabyhoun's ears often have shorter hair at the bottom, unlike other spaniels.",
    "Training: Stabyhouns respond very poorly to harsh discipline. They need positive, cheerful motivation.",
    "Activity: Mental stimulation (sniffing, puzzles) tires a puppy out 3x faster than physical walking.",
    "History: During WWII, the breed was kept safe by farmers in Friesland, recognized officially in 1942.",
    "Development: At 12 weeks, your puppy's permanent teeth will start pushing out the milk teeth.",
    "Fun Fact: 'Stabij' is the common nickname for the breed in the Netherlands.",
    "Sleep: Puppies this age need 18-20 hours of sleep a day to grow properly.",
    "Breed Fact: Most Stabyhouns are black and white, but brown and white exists and is quite rare.",
    "Breed Fact: Orange and white Stabyhouns are nearly extinct.",
    "Socialization: The 'Rule of 12' suggests meeting 12 new people, surfaces, and sounds by 12 weeks.",
    "History: Stabyhouns were historically used to churn butter by walking on a treadmill device.",
    "Temperament: Stabyhouns are known to be excellent with children and other pets.",
    "Anatomy: They are slightly longer than they are tall.",
    "Fun Fact: The Stabyhoun has a very keen sense of smell, originally used to track moles underground.",
    "Training: Recall training starts now! Use their name and high-value treats.",
    "Health: Avoid stairs and jumping in and out of cars to protect their joints.",
    "Fact: Dogs have sweat glands only in their paw pads.",
    "Fact: A dog's nose print is as unique as a human fingerprint.",
    "Development: By 16 weeks, the critical socialization window begins to close.",
    "Breed Fact: In the Netherlands, they are often seen as national treasures.",
    "Fun Fact: Stabyhouns are not usually barkers, but they will alert you if something is wrong.",
    "Activity: A 10-minute sniff walk is better than a 20-minute power walk for a puppy.",
    "Diet: Puppies grow fast! Monitor their weight weekly to adjust food portions.",
    "Bonding: Hand-feeding your puppy can help prevent resource guarding.",
    "Breed Fact: The Stabyhoun tail usually has a white tip.",
    "Activity: Swimming is great low-impact exercise for Stabyhouns once the water is warm enough."
]

DEFAULT_STRINGS = {
    "birth_summary": "{name} was born!",
    "birth_desc": "{name} the Stabyhoun was born on this day.",
    "walk_summary": "{name} - Walk: {mins} mins (x2)",
    "walk_rule": "Rule: {mins} minutes per walk, twice a day.",
    "todays_fact": "Today's fact: {fact}",
    "source": "Source: 5-minute rule (Puppy Culture/Kennel Clubs).",
    "age_summary": "{name} is {weeks} Weeks Old Today!",
    "age_desc": "{name} the Stabyhoun is now {weeks} weeks old.",
    "birthday_summary_1": "{name}'s 1st Birthday!",
    "birthday_summary_n": "{name}'s {n}th Birthday!",
    "birthday_desc": "Happy birthday to {name}!",
    "success": "Success! '{filename}' has been created.",
}


def _safe_read_json(path: str):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_i18n(lang: str):
    normalized = (lang or "en").split("_")[0].split("-")[0].lower()
    i18n_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "i18n")

    base = _safe_read_json(os.path.join(i18n_dir, "en.json"))
    merged_strings = {**DEFAULT_STRINGS, **base.get("strings", {})}
    merged_facts = base.get("facts", FACTS_EN)

    if normalized != "en":
        override = _safe_read_json(os.path.join(i18n_dir, f"{normalized}.json"))
        merged_strings.update(override.get("strings", {}))
        if override.get("facts"):
            merged_facts = override["facts"]

    if not merged_facts:
        merged_facts = FACTS_EN

    return {"strings": merged_strings, "facts": merged_facts}


def get_walking_minutes(current_date, birthdate):
    age_in_days = (current_date - birthdate).days
    age_in_months = age_in_days / 30.44
    if age_in_months < 3:
        return 10
    elif age_in_months < 4:
        return 15
    elif age_in_months < 5:
        return 20
    elif age_in_months < 6:
        return 25
    else:
        return 30


def _escape_ics_text(text: str) -> str:
    # RFC5545 text escaping for calendar fields.
    return (
        text.replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )


def create_ics_event(start_dt, summary, description, uid_suffix, comment=None):
    dt_str = start_dt.strftime("%Y%m%d")
    dt_end_str = (start_dt + datetime.timedelta(days=1)).strftime("%Y%m%d")
    summary_escaped = _escape_ics_text(summary)
    description_escaped = _escape_ics_text(description)
    comment_line = ""
    if comment:
        comment_line = f"COMMENT:{_escape_ics_text(comment)}\n"
    return f"""BEGIN:VEVENT
DTSTART;VALUE=DATE:{dt_str}
DTEND;VALUE=DATE:{dt_end_str}
SUMMARY:{summary_escaped}
DESCRIPTION:{description_escaped}
{comment_line}UID:{dt_str}-{uid_suffix}@stabyhoun-schedule
STATUS:CONFIRMED
TRANSP:TRANSPARENT
END:VEVENT
"""


def generate_ics(lang: str = "en"):
    i18n = load_i18n(lang)
    strings = i18n["strings"]
    facts = i18n["facts"]

    def tr(key: str, **kwargs):
        return strings[key].format(**kwargs)

    file_content = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:-//puppy-ics//{__version__}//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ]

    birth_summary = tr("birth_summary", name=PUPPY_NAME)
    birth_desc = tr("birth_desc", name=PUPPY_NAME)
    file_content.append(
        create_ics_event(BIRTHDATE, birth_summary, birth_desc, "birth", comment=birth_desc)
    )

    current_date = ARRIVAL_DATE
    fact_index = 0

    while current_date <= END_DATE:
        walk_mins = get_walking_minutes(current_date, BIRTHDATE)
        todays_fact = facts[fact_index % len(facts)]
        fact_index += 1

        walk_summary = tr("walk_summary", name=PUPPY_NAME, mins=walk_mins)
        walk_desc = (
            tr("walk_rule", mins=walk_mins)
            + "\n\n"
            + tr("todays_fact", fact=todays_fact)
            + "\n\n"
            + tr("source")
        )
        file_content.append(
            create_ics_event(
                current_date,
                walk_summary,
                walk_desc,
                "walk",
                comment=todays_fact,
            )
        )

        if current_date.weekday() == 0:
            age_days = (current_date - BIRTHDATE).days
            age_weeks = age_days // 7
            age_summary = tr("age_summary", name=PUPPY_NAME, weeks=age_weeks)
            age_desc = tr("age_desc", name=PUPPY_NAME, weeks=age_weeks)
            file_content.append(
                create_ics_event(current_date, age_summary, age_desc, "age", comment=age_desc)
            )

        if current_date.month == BIRTHDATE.month and current_date.day == BIRTHDATE.day:
            years_old = (current_date - BIRTHDATE).days // 365
            if years_old == 1:
                bday_summary = tr("birthday_summary_1", name=PUPPY_NAME)
            else:
                bday_summary = tr("birthday_summary_n", name=PUPPY_NAME, n=years_old)
            bday_desc = tr("birthday_desc", name=PUPPY_NAME)
            file_content.append(
                create_ics_event(
                    current_date,
                    bday_summary,
                    bday_desc,
                    "birthday",
                    comment=bday_desc,
                )
            )

        current_date += datetime.timedelta(days=1)

    file_content.append("END:VCALENDAR")

    out_filename = "stabyhoun_puppy_schedule.ics"
    with open(out_filename, "w", encoding="utf-8") as f:
        f.write("\n".join(file_content))

    print(tr("success", filename=out_filename))


def main():
    parser = argparse.ArgumentParser(description="Generate Stabyhoun puppy walking schedule as ICS.")
    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    parser.add_argument(
        "--lang", "-l",
        default=os.environ.get("LANGUAGE", "en").split(":")[0].split("_")[0] or "en",
        help="Language code (e.g. en, nl). Default: en or LANGUAGE env.",
    )
    args = parser.parse_args()
    generate_ics(lang=args.lang)


if __name__ == "__main__":
    main()
