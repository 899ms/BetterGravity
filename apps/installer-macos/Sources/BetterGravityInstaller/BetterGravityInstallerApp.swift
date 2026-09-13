import SwiftUI

@main
struct BetterGravityInstallerApp: App {
    @StateObject private var model = InstallerModel()

    var body: some Scene {
        WindowGroup {
            ContentView(model: model)
                .frame(width: 720, height: 610)
                .background(Color(red: 19/255.0, green: 19/255.0, blue: 20/255.0)) // #131314
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
    }
}
