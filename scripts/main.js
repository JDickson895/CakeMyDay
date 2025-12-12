// ============================================================================
// MAIN APPLICATION - Cake 3D Viewer
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================================================
    // ELEMENT REFERENCES
    // ========================================================================
    const bigHeroCake = document.getElementById('big-hero-cake');
    const heroModelViewer = document.getElementById('hero-model-viewer');
    const btnChange = document.querySelector('.btn-change');
    const modal = document.getElementById('modal-3d');
    const modalClose = document.querySelector('.modal-close');
    const modalCakeName = document.getElementById('modal-cake-name');
    const modelViewer = document.getElementById('model-viewer');
    const btn3dButtons = document.querySelectorAll('.btn-3d');
    const btnArButtons = document.querySelectorAll('.btn-ar');
    const colorPicker = document.getElementById('color-picker');
    const colorPresets = document.querySelectorAll('.color-preset');
    const resetColorBtn = document.getElementById('reset-color');
    const modalAr = document.getElementById('modal-ar');
    const modalArClose = document.querySelector('.modal-ar-close');
    const modalArCakeName = document.getElementById('modal-ar-cake-name');
    const arIframe = document.getElementById('ar-iframe');

    // ========================================================================
    // CAKE MODEL DATA
    // ========================================================================
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
    
    const cakeModelKeys = Object.keys(cakeModels);
    let currentModelIndex = 1;

    // ========================================================================
    // BIG HERO CAKE - SCROLL ROTATION
    // ========================================================================
    if (bigHeroCake) {
        // Rotate model based on scroll position
        function handleScrollRotation() {
            if (!bigHeroCake) return;
            
            const scrollY = window.scrollY || window.pageYOffset;
            const rotation = scrollY * 0.3; // 0.3 degrees per pixel
            
            bigHeroCake.setAttribute('camera-orbit', `${rotation}deg 75deg auto`);
        }

        // Scroll handler
        window.addEventListener('scroll', function() {
            handleScrollRotation();
        }, { passive: true });

        // Initialize rotation on load
        setTimeout(function() {
            handleScrollRotation();
        }, 200);
        
        // Update rotation on resize
        window.addEventListener('resize', function() {
            handleScrollRotation();
        });
    }

    // ========================================================================
    // HERO MODEL VIEWER - CHANGE MODEL BUTTON
    // ========================================================================
    if (btnChange && heroModelViewer) {
        btnChange.addEventListener('click', function() {
            currentModelIndex = (currentModelIndex + 1) % cakeModelKeys.length;
            const newModelKey = cakeModelKeys[currentModelIndex];
            const newModelPath = cakeModels[newModelKey];
            
            heroModelViewer.setAttribute('src', newModelPath);
            heroModelViewer.setAttribute('alt', newModelKey.replace('-', ' '));
        });
    }

    // ========================================================================
    // MODAL - 3D MODEL VIEWER WITH COLOR CUSTOMIZATION
    // ========================================================================
    let originalMaterialColors = [];
    let currentModel = null;

    // Convert hex color to RGB array
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return [
                parseInt(result[1], 16) / 255,
                parseInt(result[2], 16) / 255,
                parseInt(result[3], 16) / 255,
                1.0
            ];
        } else {
            return [1, 0.4, 0.8, 1]; // Default pink
        }
    }

    // Store original material colors
    function storeOriginalColors() {
        originalMaterialColors = [];
        if (currentModel && currentModel.materials) {
            currentModel.materials.forEach(function(material, index) {
                if (material.pbrMetallicRoughness) {
                    const baseColor = material.pbrMetallicRoughness.baseColorFactor;
                    if (baseColor) {
                        originalMaterialColors[index] = [...baseColor];
                    } else {
                        originalMaterialColors[index] = [1, 1, 1, 1];
                    }
                } else {
                    originalMaterialColors[index] = [1, 1, 1, 1];
                }
            });
        }
    }

    // Change cake color
    function changeCakeColor(colorHex) {
        if (!currentModel || !currentModel.materials) return;
        
        const rgbColor = hexToRgb(colorHex);
        currentModel.materials.forEach(function(material) {
            if (material.pbrMetallicRoughness) {
                material.pbrMetallicRoughness.setBaseColorFactor(rgbColor);
            }
        });
    }

    // Reset to original colors
    function resetToOriginalColors() {
        if (!currentModel || !currentModel.materials || originalMaterialColors.length === 0) return;

        currentModel.materials.forEach(function(material, index) {
            if (material.pbrMetallicRoughness && originalMaterialColors[index]) {
                material.pbrMetallicRoughness.setBaseColorFactor(originalMaterialColors[index]);
            }
        });

        if (colorPicker) {
            colorPicker.value = '#ff69b4';
        }
        colorPresets.forEach(function(preset) {
            preset.classList.remove('active');
        });
    }

    // Listen for model load
    if (modelViewer) {
        modelViewer.addEventListener('load', function() {
            currentModel = modelViewer.model;
            if (currentModel) {
                storeOriginalColors();
            }
        });
    }

    // Color picker handler
    if (colorPicker) {
        colorPicker.addEventListener('input', function() {
            const selectedColor = this.value;
            changeCakeColor(selectedColor);
            
            colorPresets.forEach(function(preset) {
                const presetColor = preset.getAttribute('data-color').toLowerCase();
                if (presetColor === selectedColor.toLowerCase()) {
                    preset.classList.add('active');
                } else {
                    preset.classList.remove('active');
                }
            });
        });
    }

    // Color preset buttons
    colorPresets.forEach(function(preset) {
        preset.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            
            if (colorPicker) {
                colorPicker.value = color;
            }
            
            changeCakeColor(color);
            colorPresets.forEach(function(p) {
                p.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Reset color button
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', resetToOriginalColors);
    }

    // Open modal
    btn3dButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const cakeId = this.getAttribute('data-cake');
            const cakeName = this.closest('.cake-card').querySelector('.cake-name').textContent;
            const modelPath = cakeModels[cakeId] || 'assets/chocolate.glb';

            modalCakeName.textContent = cakeName;
            modelViewer.setAttribute('src', modelPath);
            modal.style.display = 'block';
            
            if (colorPicker) {
                colorPicker.value = '#ff69b4';
            }
            colorPresets.forEach(function(preset) {
                preset.classList.remove('active');
            });
        });
    });

    // Close modal handlers
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });

    // ========================================================================
    // AR MODAL - HANDLE AR BUTTON CLICKS
    // ========================================================================
    const arUrls = {
        'chocolate': 'https://jonathan3630.8thwall.app/scene21/',
        'blackforest': 'https://jonathan3630.8thwall.app/mycakes/',
        'wedding-cake': 'https://jonathan3630.8thwall.app/scene22/',
        'strawberry': 'https://jonathan3630.8thwall.app/strawberry/',
        'carousel': 'https://jonathan3630.8thwall.app/carousel/',
        'flower-cake': 'https://jonathan3630.8thwall.app/flowercake/',
        'pear-cake': 'https://jonathan3630.8thwall.app/pearcake/',
        'Macarons-cake': 'https://jonathan3630.8thwall.app/macaronscake/',
        'circus': 'https://jonathan3630.8thwall.app/circus/',
        'lanterm': 'https://jonathan3630.8thwall.app/lanterm/',
        'flower-25': 'https://jonathan3630.8thwall.app/flower25/',
        'flower-flat-25': 'https://jonathan3630.8thwall.app/flowerflat25/',
    };

    // Open AR modal
    btnArButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const cakeId = this.getAttribute('data-cake');
            const cakeName = this.closest('.cake-card').querySelector('.cake-name').textContent;
            const arUrl = arUrls[cakeId];

            if (arUrl) {
                modalArCakeName.textContent = cakeName + ' - AR View';
                arIframe.setAttribute('src', arUrl);
                modalAr.style.display = 'block';
            } else {
                alert('AR view is not available for this cake yet.');
            }
        });
    });

    // Close AR modal handlers
    if (modalArClose) {
        modalArClose.addEventListener('click', function() {
            modalAr.style.display = 'none';
            arIframe.setAttribute('src', ''); // Clear iframe when closing
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === modalAr) {
            modalAr.style.display = 'none';
            arIframe.setAttribute('src', ''); // Clear iframe when closing
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modalAr.style.display === 'block') {
            modalAr.style.display = 'none';
            arIframe.setAttribute('src', ''); // Clear iframe when closing
        }
    });

});


// Speech functionality
document.querySelectorAll(".speak-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const audioSrc = btn.getAttribute("data-audio");
  
      const audio = new Audio(audioSrc);
      audio.play();
    });
  });
