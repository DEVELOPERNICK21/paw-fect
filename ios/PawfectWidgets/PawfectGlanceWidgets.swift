import SwiftUI
import WidgetKit

// Add a Widget Extension target in Xcode (File → New → Target → Widget Extension),
// name it "PawfectWidgets", include these files, and set App Group: group.app.pawfect.glance

private let brandOrange = Color(red: 234 / 255, green: 88 / 255, blue: 12 / 255)

struct NextUpEntry: TimelineEntry {
  let date: Date
  let petName: String
  let title: String
  let timeLabel: String
}

struct NextUpProvider: TimelineProvider {
  func placeholder(in context: Context) -> NextUpEntry {
    NextUpEntry(date: Date(), petName: "Max", title: "Morning feed", timeLabel: "7:30 AM")
  }

  func getSnapshot(in context: Context, completion: @escaping (NextUpEntry) -> Void) {
    completion(entry(from: WidgetGlancePayloadLoader.load()) ?? placeholder(in: context))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<NextUpEntry>) -> Void) {
    let entry = entry(from: WidgetGlancePayloadLoader.load()) ?? placeholder(in: context)
    let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
    completion(Timeline(entries: [entry], policy: .after(next)))
  }

  private func entry(from payload: WidgetGlancePayload?) -> NextUpEntry? {
    guard let payload else { return nil }
    let next = payload.nextUp
    return NextUpEntry(
      date: Date(),
      petName: payload.petName,
      title: next?.title ?? "All done today",
      timeLabel: next?.timeLabel ?? ""
    )
  }
}

struct NextUpWidgetView: View {
  let entry: NextUpEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(entry.petName)
        .font(.caption2)
        .foregroundStyle(.secondary)
      Text(entry.title)
        .font(.headline)
        .lineLimit(1)
      if !entry.timeLabel.isEmpty {
        Text(entry.timeLabel)
          .font(.subheadline.weight(.semibold))
          .foregroundStyle(brandOrange)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

struct NextUpWidget: Widget {
  let kind = "NextUpWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: NextUpProvider()) { entry in
      NextUpWidgetView(entry: entry)
    }
    .configurationDisplayName("Next care")
    .description("Next feeding, walk, or care task.")
    .supportedFamilies([
      .accessoryRectangular,
      .accessoryInline,
      .systemSmall,
    ])
  }
}

struct MilestoneEntry: TimelineEntry {
  let date: Date
  let petName: String
  let title: String
  let countdown: String
}

struct MilestoneProvider: TimelineProvider {
  func placeholder(in context: Context) -> MilestoneEntry {
    MilestoneEntry(date: Date(), petName: "Max", title: "Rabies vaccine", countdown: "IN 12 DAYS")
  }

  func getSnapshot(in context: Context, completion: @escaping (MilestoneEntry) -> Void) {
    completion(entry(from: WidgetGlancePayloadLoader.load()) ?? placeholder(in: context))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<MilestoneEntry>) -> Void) {
    let entry = entry(from: WidgetGlancePayloadLoader.load()) ?? placeholder(in: context)
    let next = Calendar.current.date(byAdding: .hour, value: 6, to: Date()) ?? Date()
    completion(Timeline(entries: [entry], policy: .after(next)))
  }

  private func entry(from payload: WidgetGlancePayload?) -> MilestoneEntry? {
    guard let payload, let m = payload.milestone else { return nil }
    return MilestoneEntry(
      date: Date(),
      petName: payload.petName,
      title: m.title,
      countdown: m.countdownLabel.uppercased()
    )
  }
}

struct MilestoneWidgetView: View {
  let entry: MilestoneEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(entry.petName)
        .font(.caption2)
        .foregroundStyle(.secondary)
      Text(entry.title)
        .font(.headline)
        .lineLimit(2)
      Text(entry.countdown)
        .font(.caption.weight(.bold))
        .foregroundStyle(brandOrange)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

struct MilestoneWidget: Widget {
  let kind = "MilestoneWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: MilestoneProvider()) { entry in
      MilestoneWidgetView(entry: entry)
    }
    .configurationDisplayName("Next milestone")
    .description("Upcoming vaccination or deworming.")
    .supportedFamilies([
      .accessoryRectangular,
      .accessoryCircular,
      .systemSmall,
    ])
  }
}

@main
struct PawfectGlanceWidgetsBundle: WidgetBundle {
  var body: some Widget {
    NextUpWidget()
    MilestoneWidget()
  }
}
