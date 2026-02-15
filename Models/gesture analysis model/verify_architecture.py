"""Verify model architecture matches training code"""
import json
from tensorflow.keras.models import Sequential

# Load model config
with open('config.json', 'r') as f:
    config_data = json.load(f)

config = config_data['config']
model = Sequential.from_config(config)

print("=" * 70)
print("MODEL ARCHITECTURE VERIFICATION")
print("=" * 70)
print()

print("ACTUAL MODEL LAYERS:")
for i, layer in enumerate(model.layers):
    print(f"  {i+1}. {layer.name}: {type(layer).__name__}")
    if hasattr(layer, 'units'):
        print(f"     Units: {layer.units}")
        if hasattr(layer, 'activation'):
            print(f"     Activation: {layer.activation.__name__ if callable(layer.activation) else layer.activation}")
    if hasattr(layer, 'layer') and hasattr(layer.layer, 'units'):
        print(f"     Inner LSTM units: {layer.layer.units}")
        if hasattr(layer.layer, 'return_sequences'):
            print(f"     return_sequences: {layer.layer.return_sequences}")
    print()

print("=" * 70)
print("EXPECTED FROM TRAINING CODE:")
print("=" * 70)
print("  1. InputLayer")
print("  2. bilstm_1: Bidirectional(LSTM(128, return_sequences=True))")
print("  3. bilstm_2: Bidirectional(LSTM(256, return_sequences=True))")
print("  4. bilstm_3: Bidirectional(LSTM(128, return_sequences=False))")
print("  5. Dense_1: 64 units, relu")
print("  6. Dense_2: 32 units, relu")
print("  7. Output_layer: 4 units, softmax")
print()

print("=" * 70)
print("VERIFICATION:")
print("=" * 70)

# Check layer count (InputLayer is implicit in Sequential, so 6 layers)
assert len(model.layers) == 6, f"Expected 6 layers (InputLayer is implicit), got {len(model.layers)}"
print("[OK] Layer count: 6 (InputLayer is implicit in Sequential)")

# Check input shape
assert model.input_shape[1:] == (30, 174), f"Expected input shape (30, 174), got {model.input_shape[1:]}"
print("[OK] Input shape: (30, 174)")

# Check output shape
assert model.output_shape[1] == 4, f"Expected output shape (4,), got {model.output_shape[1]}"
print("[OK] Output shape: (4,)")

# Check layer 0: bilstm_1 (InputLayer is implicit)
layer1 = model.layers[0]
assert layer1.name == "bilstm_1", f"Expected 'bilstm_1', got '{layer1.name}'"
assert layer1.layer.units == 128, f"Expected 128 units, got {layer1.layer.units}"
assert layer1.layer.return_sequences == True, f"Expected return_sequences=True"
print("[OK] bilstm_1: Bidirectional(LSTM(128, return_sequences=True))")

# Check layer 1: bilstm_2
layer2 = model.layers[1]
assert layer2.name == "bilstm_2", f"Expected 'bilstm_2', got '{layer2.name}'"
assert layer2.layer.units == 256, f"Expected 256 units, got {layer2.layer.units}"
assert layer2.layer.return_sequences == True, f"Expected return_sequences=True"
print("[OK] bilstm_2: Bidirectional(LSTM(256, return_sequences=True))")

# Check layer 2: bilstm_3
layer3 = model.layers[2]
assert layer3.name == "bilstm_3", f"Expected 'bilstm_3', got '{layer3.name}'"
assert layer3.layer.units == 128, f"Expected 128 units, got {layer3.layer.units}"
assert layer3.layer.return_sequences == False, f"Expected return_sequences=False"
print("[OK] bilstm_3: Bidirectional(LSTM(128, return_sequences=False))")

# Check layer 3: Dense_1
layer4 = model.layers[3]
assert layer4.name == "Dense_1", f"Expected 'Dense_1', got '{layer4.name}'"
assert layer4.units == 64, f"Expected 64 units, got {layer4.units}"
assert layer4.activation.__name__ == "relu", f"Expected relu activation"
print("[OK] Dense_1: 64 units, relu")

# Check layer 4: Dense_2
layer5 = model.layers[4]
assert layer5.name == "Dense_2", f"Expected 'Dense_2', got '{layer5.name}'"
assert layer5.units == 32, f"Expected 32 units, got {layer5.units}"
assert layer5.activation.__name__ == "relu", f"Expected relu activation"
print("[OK] Dense_2: 32 units, relu")

# Check layer 5: Output_layer
layer6 = model.layers[5]
assert layer6.name == "Output_layer", f"Expected 'Output_layer', got '{layer6.name}'"
assert layer6.units == 4, f"Expected 4 units, got {layer6.units}"
assert layer6.activation.__name__ == "softmax", f"Expected softmax activation"
print("[OK] Output_layer: 4 units, softmax")

print()
print("=" * 70)
print("[SUCCESS] ALL CHECKS PASSED - ARCHITECTURE MATCHES TRAINING!")
print("=" * 70)

