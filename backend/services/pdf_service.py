import io
import re
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY


def clean_text(s: Any) -> str:
    """Sanitizes special unicode punctuation into ASCII characters for ReportLab standard fonts."""
    if not s:
        return ""
    text = str(s).strip()
    replacements = {
        "\u2013": "-",
        "\u2014": "--",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\ufffd": "",
        "\u00a0": " ",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.strip()


def clean_url_display(url: str) -> str:
    """Cleans URLs for compact resume display (e.g. github.com/username)."""
    if not url:
        return ""
    clean = clean_text(url)
    clean = re.sub(r"^https?://(www\.)?", "", clean.strip()).rstrip("/")
    return clean


def parse_bullet_points(content: Any) -> List[str]:
    """
    Parses a string or list into clean, complete bullet point sentences.
    Merges multiline wrapped text into single bullets and trims markers.
    """
    if not content:
        return []

    raw_lines: List[str] = []
    if isinstance(content, list):
        for item in content:
            if isinstance(item, str):
                for sub in item.split("\n"):
                    if sub.strip():
                        raw_lines.append(sub.strip())
            elif item:
                raw_lines.append(str(item).strip())
    elif isinstance(content, str):
        for sub in content.split("\n"):
            if sub.strip():
                raw_lines.append(sub.strip())
    else:
        raw_lines = [str(content).strip()]

    bullet_markers = ("•", "-", "*", "\ufffd", "–")
    bullets: List[str] = []

    for line in raw_lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        starts_with_bullet = any(line_clean.startswith(m) for m in bullet_markers) or bool(re.match(r"^\d+[\.\)]\s+", line_clean))
        cleaned_text = re.sub(r"^[•\-*\ufffd–\s\d\.\)]+\s*", "", line_clean).strip()

        if not cleaned_text:
            continue

        if starts_with_bullet or not bullets:
            bullets.append(cleaned_text)
        else:
            prev = bullets[-1]
            if not prev.endswith((".", "!", "?")) or line_clean[0].islower():
                bullets[-1] = f"{prev} {cleaned_text}"
            else:
                bullets.append(cleaned_text)

    return bullets


def generate_resume_pdf(resume_json: Dict[str, Any], template_name: str = "modern") -> bytes:
    """
    Generates a professional ATS-compliant vector PDF from resume JSON.
    Guarantees no mid-word text clipping, proper word wrapping, and
    standardized contact info directly beneath the candidate's name.
    """
    buffer = io.BytesIO()
    
    # 0.45 in (32.4 pt) margins for optimal printable area
    margin = 32.4
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )
    
    usable_width = letter[0] - (2 * margin)

    # Template theme settings
    theme = template_name.lower() if template_name else "modern"
    if theme == "software":
        base_font = "Courier"
        bold_font = "Courier-Bold"
        accent_color = colors.HexColor("#3730a3")  # Indigo
        header_align = TA_LEFT
    elif theme == "ai":
        base_font = "Helvetica"
        bold_font = "Helvetica-Bold"
        accent_color = colors.HexColor("#6d28d9")  # Violet
        header_align = TA_CENTER
    elif theme == "data":
        base_font = "Helvetica"
        bold_font = "Helvetica-Bold"
        accent_color = colors.HexColor("#0f172a")  # Slate dark
        header_align = TA_LEFT
    elif theme == "research":
        base_font = "Times-Roman"
        bold_font = "Times-Bold"
        accent_color = colors.HexColor("#111827")
        header_align = TA_CENTER
    else:  # modern default
        base_font = "Helvetica"
        bold_font = "Helvetica-Bold"
        accent_color = colors.HexColor("#1e293b")  # Deep Slate
        header_align = TA_CENTER

    rule_color = colors.HexColor("#cbd5e1")
    text_color = colors.HexColor("#111827")
    muted_color = colors.HexColor("#4b5563")

    styles = getSampleStyleSheet()

    # Style definitions
    name_style = ParagraphStyle(
        "CandidateName",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=18,
        leading=22,
        alignment=header_align,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=3,
    )

    contact_style = ParagraphStyle(
        "ContactLine",
        parent=styles["Normal"],
        fontName=base_font,
        fontSize=9,
        leading=12,
        alignment=header_align,
        textColor=muted_color,
        spaceAfter=5,
    )

    summary_style = ParagraphStyle(
        "SummaryText",
        parent=styles["Normal"],
        fontName=base_font,
        fontSize=8.5,
        leading=12,
        alignment=TA_JUSTIFY,
        textColor=text_color,
        spaceAfter=6,
    )

    section_heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=10,
        leading=13,
        textColor=accent_color,
        spaceBefore=7,
        spaceAfter=3,
        textTransform="uppercase",
    )

    item_title_style = ParagraphStyle(
        "ItemTitle",
        parent=styles["Normal"],
        fontName=bold_font,
        fontSize=9.5,
        leading=13,
        textColor=text_color,
    )

    item_meta_style = ParagraphStyle(
        "ItemMeta",
        parent=styles["Normal"],
        fontName=base_font,
        fontSize=8.5,
        leading=13,
        alignment=TA_RIGHT,
        textColor=muted_color,
    )

    bullet_style = ParagraphStyle(
        "ResumeBullet",
        parent=styles["Normal"],
        fontName=base_font,
        fontSize=8.5,
        leading=12,
        textColor=text_color,
        leftIndent=12,
        firstLineIndent=-9,
        spaceBefore=1.5,
        spaceAfter=1.5,
        wordWrap="CJK",
    )

    skill_style = ParagraphStyle(
        "SkillItem",
        parent=styles["Normal"],
        fontName=base_font,
        fontSize=8.5,
        leading=12,
        textColor=text_color,
        spaceBefore=1.5,
        spaceAfter=1.5,
    )

    story = []

    # 1. HEADER: Name
    summary = resume_json.get("summary", {})
    name = clean_text(summary.get("name", "Candidate Name"))
    story.append(Paragraph(f"<b>{name}</b>", name_style))

    # 2. CONTACT INFO PLACEMENT: Directly below name, pipe-separated
    email = clean_text(summary.get("email", ""))
    phone = clean_text(summary.get("phone", ""))
    github = clean_text(summary.get("github", ""))
    linkedin = clean_text(summary.get("linkedin", ""))

    contact_parts = []
    if email:
        contact_parts.append(f'<a href="mailto:{email}" color="#2563eb">{email}</a>')
    if phone:
        contact_parts.append(f"{phone}")
    if github:
        clean_gh = clean_url_display(github)
        gh_url = github if github.startswith("http") else f"https://{github}"
        contact_parts.append(f'<a href="{gh_url}" color="#2563eb">{clean_gh}</a>')
    if linkedin:
        clean_li = clean_url_display(linkedin)
        li_url = linkedin if linkedin.startswith("http") else f"https://{linkedin}"
        contact_parts.append(f'<a href="{li_url}" color="#2563eb">{clean_li}</a>')

    if contact_parts:
        pipe = ' <font color="#94a3b8">|</font> '
        contact_line_html = pipe.join(contact_parts)
        story.append(Paragraph(contact_line_html, contact_style))

    # Optional professional summary
    prof_summary = clean_text(summary.get("professional_summary", ""))
    if prof_summary:
        story.append(Spacer(1, 2))
        story.append(Paragraph(f"<i>{prof_summary}</i>", summary_style))

    def make_section_header(title: str):
        """Creates a section header with an underline."""
        header_table = Table(
            [[Paragraph(f"<b>{title.upper()}</b>", section_heading_style)]],
            colWidths=[usable_width],
        )
        header_table.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (-1, -1), 0.8, rule_color),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
        return header_table

    # 3. EDUCATION
    education = resume_json.get("education", [])
    if education:
        story.append(make_section_header("Education"))
        for edu in education:
            degree = clean_text(edu.get("degree", ""))
            institute = clean_text(edu.get("institute", ""))
            cgpa = clean_text(edu.get("cgpa", ""))
            start = clean_text(edu.get("start_date", ""))
            end = clean_text(edu.get("end_date", ""))
            
            dates = f"{start} - {end}" if start and end else (start or end)
            date_cgpa = f"GPA: {cgpa} | {dates}" if cgpa and dates else (cgpa or dates)

            title_html = f"<b>{degree}</b> - <i>{institute}</i>" if institute else f"<b>{degree}</b>"
            edu_row = [
                [
                    Paragraph(title_html, item_title_style),
                    Paragraph(date_cgpa, item_meta_style)
                ]
            ]
            t = Table(edu_row, colWidths=[usable_width * 0.72, usable_width * 0.28])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]))
            story.append(t)

    # 4. WORK EXPERIENCE
    experience = resume_json.get("experience", [])
    if experience:
        story.append(make_section_header("Work Experience"))
        for exp in experience:
            role = clean_text(exp.get("role", ""))
            company = clean_text(exp.get("company", ""))
            start = clean_text(exp.get("start_date", ""))
            end = clean_text(exp.get("end_date", "Present"))
            dates = f"{start} - {end}" if start else end

            title_html = f"<b>{role}</b> at <b>{company}</b>" if company else f"<b>{role}</b>"
            exp_row = [
                [
                    Paragraph(title_html, item_title_style),
                    Paragraph(dates, item_meta_style)
                ]
            ]
            t = Table(exp_row, colWidths=[usable_width * 0.72, usable_width * 0.28])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]))
            
            exp_flowables = [t]
            bullets = parse_bullet_points(exp.get("description", []))
            for b in bullets:
                exp_flowables.append(Paragraph(f"&bull;&nbsp;&nbsp;{clean_text(b)}", bullet_style))

            story.append(KeepTogether(exp_flowables))

    # 5. KEY PROJECTS (Fixes bullet truncation / text overflow)
    projects = resume_json.get("projects", [])
    if projects:
        story.append(make_section_header("Key Projects"))
        for proj in projects:
            title = clean_text(proj.get("title", ""))
            tech_stack = proj.get("tech_stack", [])
            if isinstance(tech_stack, list):
                tech_str = ", ".join([clean_text(t) for t in tech_stack if clean_text(t)])
            else:
                tech_str = clean_text(tech_stack)

            gh_link = clean_text(proj.get("github_link", ""))
            gh_clean = clean_url_display(gh_link) if gh_link else ""
            
            if gh_clean:
                title_html = f'<b>{title}</b> (<a href="{gh_link}" color="#2563eb"><i>{gh_clean}</i></a>)'
            else:
                title_html = f"<b>{title}</b>"

            proj_row = [
                [
                    Paragraph(title_html, item_title_style),
                    Paragraph(f"<i>{tech_str}</i>" if tech_str else "", item_meta_style)
                ]
            ]
            t = Table(proj_row, colWidths=[usable_width * 0.60, usable_width * 0.40])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
            ]))
            
            proj_flowables = [t]
            bullets = parse_bullet_points(proj.get("description", ""))
            for b in bullets:
                # Fully wrapped bullet point - no clipping, dynamic width
                proj_flowables.append(Paragraph(f"&bull;&nbsp;&nbsp;{clean_text(b)}", bullet_style))

            story.append(KeepTogether(proj_flowables))

    # 6. SKILLS
    skills = resume_json.get("skills", [])
    if skills:
        story.append(make_section_header("Skills & Competencies"))
        for sk in skills:
            cat = clean_text(sk.get("category", ""))
            items = sk.get("items", [])
            if isinstance(items, list):
                items_str = ", ".join([clean_text(i) for i in items if clean_text(i)])
            else:
                items_str = clean_text(items)
            
            if items_str:
                skill_text = f"<b>{cat}:</b> {items_str}" if cat else items_str
                story.append(Paragraph(skill_text, skill_style))

    # 7. ACHIEVEMENTS
    achievements = resume_json.get("achievements", [])
    if achievements:
        story.append(make_section_header("Achievements & Honors"))
        ach_bullets = parse_bullet_points(achievements)
        for ach in ach_bullets:
            story.append(Paragraph(f"&bull;&nbsp;&nbsp;{clean_text(ach)}", bullet_style))

    # Build PDF
    doc.build(story)
    return buffer.getvalue()
