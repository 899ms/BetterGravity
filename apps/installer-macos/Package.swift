// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BetterGravityInstaller",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "BetterGravityInstaller", targets: ["BetterGravityInstaller"])
    ],
    targets: [
        .executableTarget(
            name: "BetterGravityInstaller",
            path: "Sources/BetterGravityInstaller",
            resources: [
                .process("Resources")
            ]
        )
    ]
)
