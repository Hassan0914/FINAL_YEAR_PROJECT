# Simple PRAAT Script for Voice Feature Extraction
form Extract Voice Features
    sentence AudioFile
    sentence OutputFile
endform

# Read audio file
Read from file... 'AudioFile$'
soundName$ = selected$("Sound")

# Select the sound object
select Sound 'soundName$'

# Extract basic features
duration = Get total duration
# Get RMS energy (root mean square) instead of Get power
rms = Get root-mean-square... 0.0 0.0
# Get intensity in dB
intensity = Get intensity (dB)

# Write results to output file
writeFileLine: "OutputFile$", "duration,rms,intensity"
writeFileLine: "OutputFile$", "'duration','rms','intensity'"

