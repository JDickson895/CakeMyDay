// 3D Model Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal-3d');
    const modalClose = document.querySelector('.modal-close');
    const modalCakeName = document.getElementById('modal-cake-name');
    const modelViewer = document.getElementById('model-viewer');
    const btn3dButtons = document.querySelectorAll('.btn-3d');
    const heroModelViewer = document.getElementById('hero-model-viewer');
    const btnChange = document.querySelector('.btn-change');

    // Map cake names to their 3D model files
    const cakeModels = {
        'chocolate': 'assets/chocolate.glb',
        'wedding-cake': 'assets/wedding-cake.glb',
        'strawberry': 'assets/strawberry.glb',
        'carousel': 'assets/carousel.glb',
        'flower-cake': 'assets/flower-cake.glb',
        'pear-cake': 'assets/pear-cake.glb',
        'Macarons-cake': 'assets/Macarons-cake.glb',
        'circus': 'assets/circus.glb',
        'blackforest': 'assets/blackforest.glb',
        'lanterm': 'assets/lanterm.glb',
        'flower-25': 'assets/flower-25.glb',
        'flower-flat-25': 'assets/flower-flat-25.glb'
    };

    // Get all cake model keys for cycling
    const cakeModelKeys = Object.keys(cakeModels);
    let currentModelIndex = 1; // Start at wedding-cake (index 1)

    // Hero model customization controls
    const modelSelect = document.getElementById('model-select');
    const exposureSlider = document.getElementById('exposure-slider');
    const exposureValue = document.getElementById('exposure-value');
    const shadowSlider = document.getElementById('shadow-slider');
    const shadowValue = document.getElementById('shadow-value');
    const environmentSelect = document.getElementById('environment-select');
    const autoRotateCheck = document.getElementById('auto-rotate-check');

    // Change model button - cycle through models
    if (btnChange && heroModelViewer) {
        btnChange.addEventListener('click', function() {
            currentModelIndex = (currentModelIndex + 1) % cakeModelKeys.length;
            const newModelKey = cakeModelKeys[currentModelIndex];
            const newModelPath = cakeModels[newModelKey];
            
            heroModelViewer.setAttribute('src', newModelPath);
            heroModelViewer.setAttribute('alt', newModelKey.replace('-', ' '));
            
            // Update select dropdown
            if (modelSelect) {
                modelSelect.value = newModelKey;
            }
        });
    }

    // Model select dropdown
    if (modelSelect && heroModelViewer) {
        modelSelect.addEventListener('change', function() {
            const selectedModel = this.value;
            const modelPath = cakeModels[selectedModel] || cakeModels['wedding-cake'];
            heroModelViewer.setAttribute('src', modelPath);
            heroModelViewer.setAttribute('alt', selectedModel.replace('-', ' '));
        });
    }

    // Exposure slider
    if (exposureSlider && heroModelViewer) {
        exposureSlider.addEventListener('input', function() {
            const value = this.value;
            exposureValue.textContent = parseFloat(value).toFixed(1);
            heroModelViewer.setAttribute('exposure', value);
        });
    }

    // Shadow intensity slider
    if (shadowSlider && heroModelViewer) {
        shadowSlider.addEventListener('input', function() {
            const value = this.value;
            shadowValue.textContent = parseFloat(value).toFixed(1);
            heroModelViewer.setAttribute('shadow-intensity', value);
        });
    }

    // Environment select
    if (environmentSelect && heroModelViewer) {
        environmentSelect.addEventListener('change', function() {
            const envValue = this.value;
            if (envValue) {
                heroModelViewer.setAttribute('environment-image', envValue);
            } else {
                heroModelViewer.removeAttribute('environment-image');
            }
        });
    }

    // Auto-rotate checkbox
    if (autoRotateCheck && heroModelViewer) {
        autoRotateCheck.addEventListener('change', function() {
            if (this.checked) {
                heroModelViewer.setAttribute('auto-rotate', '');
            } else {
                heroModelViewer.removeAttribute('auto-rotate');
            }
        });
    }

    // Example: How to customize materials/colors (if models support it)
    // You can access the model and modify materials after it loads:
    /*
    heroModelViewer.addEventListener('load', () => {
        const model = heroModelViewer.model;
        if (model) {
            // Access materials
            model.materials.forEach((material) => {
                // Change base color
                if (material.pbrMetallicRoughness) {
                    material.pbrMetallicRoughness.setBaseColorFactor([1, 0, 0, 1]); // Red
                }
                // Or use material.setProperty('baseColorFactor', [r, g, b, a])
            });
        }
    });
    */

    // Example: How to use variants (if models have variants defined)
    /*
    // First check if model has variants
    heroModelViewer.addEventListener('load', () => {
        const variantNames = heroModelViewer.availableVariants;
        if (variantNames && variantNames.length > 0) {
            // Switch to a variant
            heroModelViewer.variantName = variantNames[0];
        }
    });
    */

    // Color customization variables
    const colorPicker = document.getElementById('color-picker');
    const colorPresets = document.querySelectorAll('.color-preset');
    const resetColorBtn = document.getElementById('reset-color');
    let originalMaterialColors = [];
    let currentModel = null;

    // Function to convert hex color to RGB array [r, g, b, a]
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
            1.0
        ] : [1, 0.4, 0.8, 1]; // Default pink if invalid
    }

    // Function to store original material colors
    function storeOriginalColors() {
        originalMaterialColors = [];
        if (currentModel && currentModel.materials) {
            currentModel.materials.forEach((material, index) => {
                if (material.pbrMetallicRoughness) {
                    const baseColor = material.pbrMetallicRoughness.baseColorFactor;
                    originalMaterialColors[index] = baseColor ? [...baseColor] : [1, 1, 1, 1];
                } else {
                    originalMaterialColors[index] = [1, 1, 1, 1];
                }
            });
        }
    }

    // Function to change cake color
    function changeCakeColor(colorHex) {
        if (!currentModel || !currentModel.materials) return;

        const rgbColor = hexToRgb(colorHex);
        
        currentModel.materials.forEach((material) => {
            if (material.pbrMetallicRoughness) {
                // Set the base color factor
                material.pbrMetallicRoughness.setBaseColorFactor(rgbColor);
            }
        });
    }

    // Function to reset to original colors
    function resetToOriginalColors() {
        if (!currentModel || !currentModel.materials || originalMaterialColors.length === 0) return;

        currentModel.materials.forEach((material, index) => {
            if (material.pbrMetallicRoughness && originalMaterialColors[index]) {
                material.pbrMetallicRoughness.setBaseColorFactor(originalMaterialColors[index]);
            }
        });

        // Reset color picker to default
        if (colorPicker) {
            colorPicker.value = '#ff69b4';
        }

        // Remove active class from presets
        colorPresets.forEach(preset => preset.classList.remove('active'));
    }

    // Listen for model load event
    if (modelViewer) {
        modelViewer.addEventListener('load', () => {
            currentModel = modelViewer.model;
            if (currentModel) {
                storeOriginalColors();
            }
        });
    }

    // Color picker change event
    if (colorPicker) {
        colorPicker.addEventListener('input', function() {
            const selectedColor = this.value;
            changeCakeColor(selectedColor);
            
            // Update active preset if it matches
            colorPresets.forEach(preset => {
                if (preset.getAttribute('data-color').toLowerCase() === selectedColor.toLowerCase()) {
                    preset.classList.add('active');
                } else {
                    preset.classList.remove('active');
                }
            });
        });
    }

    // Color preset buttons
    colorPresets.forEach(preset => {
        preset.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            
            // Update color picker
            if (colorPicker) {
                colorPicker.value = color;
            }
            
            // Change the color
            changeCakeColor(color);
            
            // Update active state
            colorPresets.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Reset color button
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', function() {
            resetToOriginalColors();
        });
    }

    // Open modal when "View in 3D" button is clicked
    btn3dButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cakeId = this.getAttribute('data-cake');
            const cakeName = this.closest('.cake-card').querySelector('.cake-name').textContent;
            const modelPath = cakeModels[cakeId] || 'assets/chocolate.glb';

            modalCakeName.textContent = cakeName;
            modelViewer.setAttribute('src', modelPath);
            modal.style.display = 'block';
            
            // Reset color picker when opening modal
            if (colorPicker) {
                colorPicker.value = '#ff69b4';
            }
            colorPresets.forEach(preset => preset.classList.remove('active'));
        });
    });

    // Close modal when X is clicked
    modalClose.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
});

