// macOS AVFoundation, no external encoder. Usage: swift scripts/encode-hero-film.swift SOURCE OUTPUT WIDTH HEIGHT BITRATE
import Foundation
import AVFoundation

struct Failure: Error { let message: String }
func require(_ valid: Bool, _ message: String) throws { if !valid { throw Failure(message: message) } }

let args = Array(CommandLine.arguments.dropFirst())
do {
    try require(args.count == 5, "Expected SOURCE OUTPUT WIDTH HEIGHT BITRATE")
    guard let width = Int(args[2]), let height = Int(args[3]), let bitrate = Int(args[4]) else { throw Failure(message: "Invalid encoding parameters") }
    try require(width > 0 && height > 0 && width * 9 == height * 16 && bitrate > 0, "Expected positive 16:9 dimensions and bitrate")
    let source = AVURLAsset(url: URL(fileURLWithPath: args[0]))
    let destination = URL(fileURLWithPath: args[1])
    try require(!FileManager.default.fileExists(atPath: destination.path), "Destination exists")
    let workspace = FileManager.default.temporaryDirectory.appendingPathComponent("jammers-hero-encode-" + UUID().uuidString, isDirectory: true)
    try FileManager.default.createDirectory(at: workspace, withIntermediateDirectories: false)
    defer { try? FileManager.default.removeItem(at: workspace) }
    let encodedFile = workspace.appendingPathComponent("encoded.mp4")
    guard let track = source.tracks(withMediaType: .video).first else { throw Failure(message: "No source video") }
    try require(source.tracks(withMediaType: .audio).isEmpty, "Source must be silent")
    try require(abs(CMTimeGetSeconds(source.duration) - 15) < 0.001, "Expected accepted 15-second source")
    try require(track.naturalSize.width * 9 == track.naturalSize.height * 16, "Source is not 16:9")
    let reader = try AVAssetReader(asset: source)
    let video = AVMutableVideoComposition()
    video.renderSize = CGSize(width: width, height: height)
    video.frameDuration = CMTime(value: 1, timescale: 24)
    let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: track)
    layer.setTransform(track.preferredTransform.concatenating(CGAffineTransform(scaleX: Double(width) / track.naturalSize.width, y: Double(height) / track.naturalSize.height)), at: .zero)
    let instruction = AVMutableVideoCompositionInstruction()
    instruction.timeRange = CMTimeRange(start: .zero, duration: source.duration)
    instruction.layerInstructions = [layer]
    video.instructions = [instruction]
    let output = AVAssetReaderVideoCompositionOutput(videoTracks: [track], videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
    output.videoComposition = video
    output.alwaysCopiesSampleData = false
    try require(reader.canAdd(output), "Cannot add reader")
    reader.add(output)
    let writer = try AVAssetWriter(outputURL: encodedFile, fileType: .mp4)
    writer.shouldOptimizeForNetworkUse = true
    writer.metadata = []
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height, AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate, AVVideoMaxKeyFrameIntervalKey: 48, AVVideoExpectedSourceFrameRateKey: 24, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]])
    input.expectsMediaDataInRealTime = false
    try require(writer.canAdd(input), "Cannot add writer")
    writer.add(input)
    try require(writer.startWriting() && reader.startReading(), "Cannot start encoding")
    writer.startSession(atSourceTime: .zero)
    while let sample = output.copyNextSampleBuffer() {
        let deadline = Date().addingTimeInterval(30)
        while !input.isReadyForMoreMediaData {
            try require(writer.status == .writing && Date() < deadline, "Writer stalled")
            Thread.sleep(forTimeInterval: 0.005)
        }
        try require(input.append(sample), writer.error?.localizedDescription ?? "Cannot append frame")
    }
    try require(reader.status == .completed, reader.error?.localizedDescription ?? "Reader incomplete")
    input.markAsFinished()
    let done = DispatchSemaphore(value: 0)
    writer.finishWriting { done.signal() }
    try require(done.wait(timeout: .now() + 60) == .success && writer.status == .completed, writer.error?.localizedDescription ?? "Writer incomplete")
    let result = AVURLAsset(url: encodedFile)
    guard let encoded = result.tracks(withMediaType: .video).first, let format = encoded.formatDescriptions.first else { throw Failure(message: "Missing encoded track") }
    try require(CMFormatDescriptionGetMediaSubType(format as! CMFormatDescription) == kCMVideoCodecType_H264, "Output is not H264")
    try require(encoded.naturalSize == CGSize(width: width, height: height) && abs(encoded.nominalFrameRate - 24) < 0.01 && abs(CMTimeGetSeconds(result.duration) - 15) < 0.001 && result.tracks(withMediaType: .audio).isEmpty, "Output verification failed")
    try FileManager.default.moveItem(at: encodedFile, to: destination)
    print("Verified: H264 \(width)x\(height), 24fps, 15.000s, no audio, fast-start, metadata stripped")
} catch { FileHandle.standardError.write(Data("Encoding failed: \(error)\n".utf8)); exit(1) }
