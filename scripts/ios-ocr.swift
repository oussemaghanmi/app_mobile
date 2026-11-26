// Lit le texte visible d'une capture du simulateur (framework Vision de macOS) et l'affiche dans les journaux
// de la CI iOS (#145) : permet de vérifier la langue affichée sans télécharger l'artefact.
// Usage (macOS) : swift scripts/ios-ocr.swift captures-ios/connexion-ar.png
import AppKit
import Foundation
import Vision

let path = CommandLine.arguments[1]
guard let image = NSImage(contentsOfFile: path),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("Capture illisible : \(path)")
    exit(0)
}
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
let wanted = ["fr-FR", "en-US", "ar-SA"]
let supported = (try? request.supportedRecognitionLanguages()) ?? []
request.recognitionLanguages = wanted.filter { supported.contains($0) }
print("Langues de lecture : \(request.recognitionLanguages)")
do {
    try VNImageRequestHandler(cgImage: cgImage).perform([request])
} catch {
    print("Lecture impossible : \(error)")
    exit(0)
}
for observation in request.results ?? [] {
    if let text = observation.topCandidates(1).first?.string { print("  \(text)") }
}
