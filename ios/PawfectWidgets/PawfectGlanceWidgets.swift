import SwiftUI
import WidgetKit

// Widget Extension target "PawfectWidgets" (iOS 16+), App Group: group.app.pawfect.ios.glance.
// Palette mirrors src/shared/theme/colors.ts.

// MARK: - Brand

private extension Color {
  init(light: (Double, Double, Double), dark: (Double, Double, Double)) {
    self.init(UIColor { trait in
      let c = trait.userInterfaceStyle == .dark ? dark : light
      return UIColor(red: c.0 / 255, green: c.1 / 255, blue: c.2 / 255, alpha: 1)
    })
  }

  static let pawAccent = Color(light: (242, 140, 40), dark: (244, 166, 79))
  /// Accent for small text; 5:1 on a white card (the plain accent is only ~2.4:1).
  static let pawAccentText = Color(light: (180, 83, 9), dark: (244, 166, 79))
  static let pawOnAccent = Color(light: (15, 23, 42), dark: (15, 23, 42))
  static let pawDanger = Color(light: (220, 38, 38), dark: (248, 113, 113))
  static let pawSuccess = Color(light: (5, 150, 105), dark: (52, 211, 153))
  static let pawCard = Color(light: (255, 255, 255), dark: (27, 38, 52))
}

// MARK: - Snapshot model shared by every widget

struct GlanceSnapshot {
  struct Task {
    let title: String
    let subtitle: String
    let done: Bool
  }

  let petName: String
  let isForToday: Bool
  let tasks: [Task]
  let nextUpTitle: String?
  let nextUpTime: String?
  let completed: Int
  let total: Int
  let milestoneTitle: String?
  let milestoneDateLabel: String?
  /// Whole days until the milestone, computed on-device so it never goes stale.
  let milestoneDays: Int?

  var left: Int { max(total - completed, 0) }
  var progress: Double { total > 0 ? Double(completed) / Double(total) : 0 }

  init(payload: WidgetGlancePayload, now: Date = Date()) {
    petName = payload.petName
    isForToday = payload.forDate.map { $0 == GlanceDates.ymd(now) } ?? true
    tasks = payload.tasks.map { Task(title: $0.title, subtitle: $0.subtitle, done: $0.done) }
    nextUpTitle = payload.nextUp?.title
    nextUpTime = payload.nextUp?.timeLabel
    if let p = payload.careProgress {
      completed = p.completed
      total = p.total
    } else {
      completed = payload.tasks.filter { $0.done }.count
      total = payload.tasks.count
    }
    milestoneTitle = payload.milestone?.title
    milestoneDateLabel = payload.milestone?.dueDateLabel
    milestoneDays = payload.milestone.flatMap { GlanceDates.daysUntil($0.dueDateYmd, now: now) }
  }

  static let sample = GlanceSnapshot(
    petName: "Max",
    tasks: [
      Task(title: "Morning walk", subtitle: "7:30 AM", done: true),
      Task(title: "Rabies booster", subtitle: "11:00 AM", done: false),
      Task(title: "Evening meal", subtitle: "6:30 PM", done: false),
    ],
    nextUpTitle: "Rabies booster",
    nextUpTime: "11:00 AM",
    milestoneTitle: "Rabies vaccine",
    milestoneDateLabel: "12 Jun",
    milestoneDays: 12
  )

  private init(
    petName: String,
    tasks: [Task],
    nextUpTitle: String?,
    nextUpTime: String?,
    milestoneTitle: String?,
    milestoneDateLabel: String?,
    milestoneDays: Int?
  ) {
    self.petName = petName
    self.isForToday = true
    self.tasks = tasks
    self.nextUpTitle = nextUpTitle
    self.nextUpTime = nextUpTime
    self.completed = tasks.filter { $0.done }.count
    self.total = tasks.count
    self.milestoneTitle = milestoneTitle
    self.milestoneDateLabel = milestoneDateLabel
    self.milestoneDays = milestoneDays
  }
}

enum GlanceDates {
  private static let formatter: DateFormatter = {
    let f = DateFormatter()
    f.calendar = Calendar.current
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone.current
    f.dateFormat = "yyyy-MM-dd"
    return f
  }()

  static func ymd(_ date: Date) -> String { formatter.string(from: date) }

  static func daysUntil(_ ymd: String, now: Date) -> Int? {
    guard let due = formatter.date(from: String(ymd.prefix(10))) else { return nil }
    let cal = Calendar.current
    return cal.dateComponents([.day], from: cal.startOfDay(for: now), to: cal.startOfDay(for: due)).day
  }

  /// Refresh at the earlier of 30 minutes or just after local midnight.
  static func nextRefresh(after now: Date) -> Date {
    let cal = Calendar.current
    let halfHour = cal.date(byAdding: .minute, value: 30, to: now) ?? now.addingTimeInterval(1800)
    let midnight = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: now))
      .map { $0.addingTimeInterval(60) } ?? halfHour
    return min(halfHour, midnight)
  }
}

private func countdownText(_ days: Int) -> String {
  switch days {
  case ..<0: return "Overdue"
  case 0: return "Today"
  case 1: return "Tomorrow"
  default: return "In \(days) days"
  }
}

// MARK: - Timeline

struct GlanceEntry: TimelineEntry {
  let date: Date
  /// nil = nothing synced yet (signed out or never opened).
  let snapshot: GlanceSnapshot?
}

struct GlanceProvider: TimelineProvider {
  func placeholder(in context: Context) -> GlanceEntry {
    GlanceEntry(date: Date(), snapshot: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (GlanceEntry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : currentEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<GlanceEntry>) -> Void) {
    let now = Date()
    completion(Timeline(entries: [currentEntry(now)], policy: .after(GlanceDates.nextRefresh(after: now))))
  }

  private func currentEntry(_ now: Date = Date()) -> GlanceEntry {
    let snapshot = WidgetGlancePayloadLoader.load().map { GlanceSnapshot(payload: $0, now: now) }
    return GlanceEntry(date: now, snapshot: snapshot)
  }
}

// MARK: - Shared view pieces

private extension View {
  @ViewBuilder
  func glanceBackground() -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) { Color.pawCard }
    } else {
      padding().background(Color.pawCard)
    }
  }

  @ViewBuilder
  func accessoryBackground() -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) { Color.clear }
    } else {
      self
    }
  }
}

private struct Eyebrow: View {
  let text: String
  var body: some View {
    Text(text)
      .font(.system(size: 10, weight: .bold))
      .tracking(0.8)
      .foregroundStyle(Color.pawAccentText)
  }
}

private struct Chip: View {
  enum Style { case soft, solid, danger }
  let text: String
  let style: Style

  var body: some View {
    Text(text)
      .font(.system(size: 12, weight: .bold))
      .lineLimit(1)
      .padding(.horizontal, 10)
      .padding(.vertical, 4)
      .foregroundStyle(foreground)
      .background(Capsule().fill(background))
  }

  private var foreground: Color {
    switch style {
    case .soft: return .pawAccentText
    case .solid: return .pawOnAccent
    case .danger: return .pawDanger
    }
  }

  private var background: Color {
    switch style {
    case .soft: return Color.pawAccent.opacity(0.15)
    case .solid: return .pawAccent
    case .danger: return Color.pawDanger.opacity(0.15)
    }
  }
}

private struct ProgressTrack: View {
  let fraction: Double

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(Color.secondary.opacity(0.2))
        Capsule().fill(Color.pawAccent).frame(width: geo.size.width * min(max(fraction, 0), 1))
      }
    }
    .frame(height: 6)
  }
}

private struct SetupView: View {
  let title: String
  let hint: String

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(title).font(.headline).foregroundStyle(.primary)
      Text(hint).font(.caption.weight(.bold)).foregroundStyle(Color.pawAccentText)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

private func emptyState(for entry: GlanceEntry) -> (title: String, hint: String)? {
  guard let s = entry.snapshot else { return ("Set up your pet", "Open Pawfect") }
  if !s.isForToday { return ("Plan out of date", "Open Pawfect to refresh") }
  return nil
}

// MARK: - Next up

struct NextUpWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: GlanceEntry

  var body: some View {
    switch family {
    case .accessoryInline:
      Text(inlineText)
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.snapshot?.petName ?? "Pawfect").font(.caption2).foregroundStyle(.secondary)
        Text(headline).font(.headline).lineLimit(1)
        if let time = detail { Text(time).font(.caption.weight(.semibold)) }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .accessoryBackground()
    default:
      small.glanceBackground()
    }
  }

  private var small: some View {
    Group {
      if let empty = emptyState(for: entry) {
        SetupView(title: empty.title, hint: empty.hint)
      } else {
        VStack(alignment: .leading, spacing: 6) {
          Eyebrow(text: "NEXT UP")
          Text(headline).font(.system(size: 16, weight: .bold)).lineLimit(2).foregroundStyle(.primary)
          if let time = detail { Chip(text: time, style: .soft) }
          Spacer(minLength: 0)
          Text(entry.snapshot?.petName ?? "").font(.caption).foregroundStyle(.secondary).lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      }
    }
  }

  private var headline: String {
    if let empty = emptyState(for: entry) { return empty.title }
    if let t = entry.snapshot?.nextUpTitle { return t }
    return (entry.snapshot?.tasks.isEmpty ?? true) ? "Nothing planned today" : "All done for today"
  }

  private var detail: String? {
    if let empty = emptyState(for: entry) { return empty.hint }
    if let t = entry.snapshot?.nextUpTime, !t.isEmpty { return t }
    return nil
  }

  private var inlineText: String {
    guard let detail else { return headline }
    return "\(headline) · \(detail)"
  }
}

struct NextUpWidget: Widget {
  let kind = "NextUpWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GlanceProvider()) { entry in
      NextUpWidgetView(entry: entry)
    }
    .configurationDisplayName("Next up")
    .description("The next care task and when it's due.")
    .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryInline])
  }
}

// MARK: - Next milestone

struct MilestoneWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: GlanceEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      ZStack {
        AccessoryWidgetBackground()
        if let days = entry.snapshot?.milestoneDays {
          VStack(spacing: 0) {
            Text(days < 0 ? "!" : "\(days)").font(.system(size: 20, weight: .bold))
            Text(days == 1 ? "day" : "days").font(.system(size: 9, weight: .semibold))
          }
        } else {
          Image(systemName: "pawprint.fill")
        }
      }
      .accessoryBackground()
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.snapshot?.petName ?? "Pawfect").font(.caption2).foregroundStyle(.secondary)
        Text(entry.snapshot?.milestoneTitle ?? "No milestone").font(.headline).lineLimit(1)
        if let days = entry.snapshot?.milestoneDays {
          Text(countdownText(days)).font(.caption.weight(.semibold))
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .accessoryBackground()
    default:
      small.glanceBackground()
    }
  }

  private var small: some View {
    Group {
      if entry.snapshot == nil {
        SetupView(title: "Set up your pet", hint: "Open Pawfect")
      } else if let title = entry.snapshot?.milestoneTitle {
        VStack(alignment: .leading, spacing: 6) {
          HStack(alignment: .firstTextBaseline) {
            Eyebrow(text: "NEXT MILESTONE")
            Spacer(minLength: 0)
          }
          Text(title).font(.system(size: 16, weight: .bold)).lineLimit(2).foregroundStyle(.primary)
          if let date = entry.snapshot?.milestoneDateLabel {
            Text(date).font(.caption).foregroundStyle(.secondary)
          }
          Spacer(minLength: 0)
          if let days = entry.snapshot?.milestoneDays {
            Chip(text: countdownText(days), style: days < 0 ? .danger : (days <= 7 ? .solid : .soft))
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
      } else {
        SetupView(title: "No upcoming milestone", hint: "Add a vaccine or deworming date")
      }
    }
  }
}

struct MilestoneWidget: Widget {
  let kind = "MilestoneWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GlanceProvider()) { entry in
      MilestoneWidgetView(entry: entry)
    }
    .configurationDisplayName("Next milestone")
    .description("Your pet's next vaccine or deworming, with a countdown.")
    .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryCircular])
  }
}

// MARK: - Today's care

struct TodaysCareWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: GlanceEntry

  var body: some View {
    switch family {
    case .accessoryCircular:
      Gauge(value: entry.snapshot?.progress ?? 0) {
        Image(systemName: "pawprint.fill")
      } currentValueLabel: {
        Text("\(entry.snapshot?.completed ?? 0)")
      }
      .gaugeStyle(.accessoryCircularCapacity)
      .accessoryBackground()
    default:
      medium.glanceBackground()
    }
  }

  private var medium: some View {
    Group {
      if let empty = emptyState(for: entry) {
        SetupView(title: empty.title, hint: empty.hint)
      } else if let s = entry.snapshot, !s.tasks.isEmpty {
        VStack(alignment: .leading, spacing: 8) {
          HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 0) {
              Text("Today's care").font(.system(size: 15, weight: .bold))
              Text(s.petName).font(.caption).foregroundStyle(.secondary).lineLimit(1)
            }
            Spacer(minLength: 8)
            Chip(text: s.left > 0 ? "\(s.left) left" : "All done", style: .soft)
          }
          ProgressTrack(fraction: s.progress)
          VStack(alignment: .leading, spacing: 6) {
            ForEach(Array(s.tasks.sorted { !$0.done && $1.done }.prefix(3).enumerated()), id: \.offset) { _, task in
              HStack(spacing: 8) {
                Image(systemName: task.done ? "checkmark.circle.fill" : "circle")
                  .foregroundStyle(task.done ? Color.pawSuccess : Color.secondary)
                Text(task.title)
                  .font(.system(size: 14, weight: .semibold))
                  .strikethrough(task.done)
                  .foregroundStyle(task.done ? Color.secondary : Color.primary)
                  .lineLimit(1)
                Spacer(minLength: 4)
                Text(task.subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(1)
              }
            }
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      } else {
        SetupView(title: "Nothing planned today", hint: "Open Pawfect to add a reminder")
      }
    }
  }
}

struct TodaysCareWidget: Widget {
  let kind = "TodaysCareWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: GlanceProvider()) { entry in
      TodaysCareWidgetView(entry: entry)
    }
    .configurationDisplayName("Today's care")
    .description("Today's care plan with progress and a tick list.")
    .supportedFamilies([.systemMedium, .accessoryCircular])
  }
}

@main
struct PawfectGlanceWidgetsBundle: WidgetBundle {
  var body: some Widget {
    NextUpWidget()
    MilestoneWidget()
    TodaysCareWidget()
  }
}
