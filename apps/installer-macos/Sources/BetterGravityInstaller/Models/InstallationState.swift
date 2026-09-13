import Foundation

struct InstallationState: Codable, Equatable {
    var kind: String
    var patchState: String?
    var path: String?
    var antigravityVersion: String?
    var betterGravityVersion: String?
    var nativePatchAvailable: Bool
    var error: String?
}

struct OperationProgress: Codable {
    var percent: Int
    var stage: String
    var message: String
}
