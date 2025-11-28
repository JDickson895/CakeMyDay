// 3D Model Modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal-3d');
    const modalClose = document.querySelector('.modal-close');
    const modalCakeName = document.getElementById('modal-cake-name');
    const modelViewer = document.getElementById('model-viewer');
    const btn3dButtons = document.querySelectorAll('.btn-3d');
    const heroModelViewer = document.getElementById('hero-model-viewer');
    const btnChange = document.querySelector('.btn-change');
    const bigHeroCake = document.getElementById('big-hero-cake');
    const bigHeroSection = document.getElementById('big-hero');

    // Skeleton wireframe mode and scroll-based progressive reveal for big hero cake
    if (bigHeroCake && bigHeroSection) {
        let originalMaterials = new Map();
        let modelLoaded = false;
        let THREE = null;
        
        // Load Three.js and setup wireframe mode
        (async function initWireframeMode() {
            try {
                // Import Three.js
                THREE = await import('three');
                
                // Wait for model to load
                bigHeroCake.addEventListener('load', () => {
                    setTimeout(() => setupWireframe(), 100);
                }, { once: true });
                
                // If already loaded
                if (bigHeroCake.loaded) {
                    setTimeout(() => setupWireframe(), 100);
                }
            } catch (error) {
                console.error('Failed to load Three.js:', error);
            }
        })();
        
        function setupWireframe() {
            if (!THREE) return;
            
            try {
                // Try multiple methods to access the Three.js scene/model
                let model = null;
                
                // Method 1: Direct access to model property
                if (bigHeroCake.model) {
                    model = bigHeroCake.model;
                }
                // Method 2: Access through scene property
                else if (bigHeroCake.scene) {
                    model = bigHeroCake.scene;
                }
                // Method 3: Access through renderer
                else {
                    try {
                        const renderer = bigHeroCake.getRenderer();
                        if (renderer && renderer.domElement) {
                            // Try to access the scene from the renderer
                            const gltfLoader = bigHeroCake.loader;
                            if (gltfLoader) {
                                model = bigHeroCake.model;
                            }
                        }
                    } catch (e) {
                        console.log('Could not access through renderer:', e);
                    }
                }
                
                // Wait a bit more if model not found yet
                if (!model) {
                    setTimeout(() => {
                        model = bigHeroCake.model || bigHeroCake.scene;
                        if (model) {
                            createWireframeMaterials(model);
                        } else {
                            console.warn('Could not access model after delay, retrying...');
                            setTimeout(setupWireframe, 500);
                        }
                    }, 200);
                    return;
                }
                
                createWireframeMaterials(model);
            } catch (error) {
                console.error('Error setting up wireframe:', error);
                // Retry once more after a delay
                setTimeout(() => {
                    if (!modelLoaded) {
                        setupWireframe();
                    }
                }, 500);
            }
        }
        
        function createWireframeMaterials(model) {
            if (!model || !THREE) return;
            
            modelLoaded = true;
            originalMaterials.clear();
            
            // Traverse the model to find all meshes and create wireframe materials
            model.traverse((object) => {
                if (object.isMesh && object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    const originalMats = [];
                    
                    materials.forEach((material) => {
                        // Store original material
                        originalMats.push(material.clone());
                    });
                    
                    // Store original materials
                    originalMaterials.set(object, {
                        materials: originalMats,
                        isArray: Array.isArray(object.material)
                    });
                    
                    // Create and apply wireframe material
                    const wireframeMats = originalMats.map(() => {
                        return new THREE.MeshBasicMaterial({
                            color: 0x000000,
                            wireframe: true,
                            transparent: true,
                            opacity: 1
                        });
                    });
                    
                    // Apply wireframe materials
                    if (Array.isArray(object.material)) {
                        object.material = wireframeMats;
                    } else {
                        object.material = wireframeMats[0];
                    }
                }
            });
            
            // Set attribute to indicate skeleton mode
            bigHeroCake.setAttribute('data-skeleton-mode', 'true');
            
            // Initial update
            updateCakeReveal();
        }
        
        // Function to update cake reveal based on scroll
        function updateCakeReveal() {
            if (!modelLoaded || originalMaterials.size === 0) return;
            
            const scrollPosition = window.scrollY || window.pageYOffset;
            const bigHeroTop = bigHeroSection.offsetTop;
            const bigHeroHeight = bigHeroSection.offsetHeight;
            const scrollWithinSection = Math.max(0, scrollPosition - bigHeroTop);
            
            // Calculate reveal progress (0 to 1) based on scroll within the section
            // Reveal happens over 70% of the section height for smooth transition
            const revealRange = bigHeroHeight * 0.7;
            let revealProgress = Math.min(1, scrollWithinSection / revealRange);
            
            // Smooth easing function
            revealProgress = easeInOutCubic(revealProgress);
            
            // Update materials based on reveal progress
            originalMaterials.forEach((orig, mesh) => {
                const materials = orig.materials;
                const wireframeOpacity = Math.max(0, 1 - revealProgress);
                const fullOpacity = revealProgress;
                
                if (revealProgress < 0.05) {
                    // Show only wireframe (skeleton mode)
                    const wireframeMats = materials.map(() => {
                        return new THREE.MeshBasicMaterial({
                            color: 0x000000,
                            wireframe: true,
                            transparent: true,
                            opacity: 1
                        });
                    });
                    
                    if (orig.isArray) {
                        mesh.material = wireframeMats;
                    } else {
                        mesh.material = wireframeMats[0];
                    }
                } else if (revealProgress < 1) {
                    // Blend between wireframe and full material
                    const blendedMats = materials.map((originalMat) => {
                        const blendedMat = originalMat.clone();
                        blendedMat.transparent = true;
                        blendedMat.opacity = fullOpacity;
                        blendedMat.depthWrite = false;
                        
                        // Enable wireframe with decreasing opacity
                        if (blendedMat.wireframe !== undefined) {
                            blendedMat.wireframe = wireframeOpacity > 0.1;
                        }
                        
                        return blendedMat;
                    });
                    
                    if (orig.isArray) {
                        mesh.material = blendedMats;
                    } else {
                        mesh.material = blendedMats[0];
                    }
                    
                    // Add wireframe overlay for better skeleton effect
                    if (wireframeOpacity > 0.1 && !mesh.userData.wireframeMesh) {
                        const wireframeMesh = mesh.clone();
                        wireframeMesh.material = materials.map(() => {
                            return new THREE.MeshBasicMaterial({
                                color: 0x000000,
                                wireframe: true,
                                transparent: true,
                                opacity: wireframeOpacity * 0.5
                            });
                        });
                        if (!orig.isArray) {
                            wireframeMesh.material = new THREE.MeshBasicMaterial({
                                color: 0x000000,
                                wireframe: true,
                                transparent: true,
                                opacity: wireframeOpacity * 0.5
                            });
                        }
                        mesh.parent.add(wireframeMesh);
                        mesh.userData.wireframeMesh = wireframeMesh;
                    } else if (mesh.userData.wireframeMesh) {
                        const wireMat = mesh.userData.wireframeMesh.material;
                        if (Array.isArray(wireMat)) {
                            wireMat.forEach(m => m.opacity = wireframeOpacity * 0.5);
                        } else {
                            wireMat.opacity = wireframeOpacity * 0.5;
                        }
                        
                        if (wireframeOpacity <= 0.1) {
                            mesh.parent.remove(mesh.userData.wireframeMesh);
                            mesh.userData.wireframeMesh = null;
                        }
                    }
                } else {
                    // Fully reveal original materials
                    const fullMats = materials.map(mat => {
                        mat.transparent = false;
                        mat.opacity = 1;
                        mat.depthWrite = true;
                        return mat;
                    });
                    
                    if (orig.isArray) {
                        mesh.material = fullMats;
                    } else {
                        mesh.material = fullMats[0];
                    }
                    
                    // Remove wireframe overlay
                    if (mesh.userData.wireframeMesh) {
                        mesh.parent.remove(mesh.userData.wireframeMesh);
                        mesh.userData.wireframeMesh = null;
                    }
                }
            });
            
            // Rotate camera based on scroll
            const rotationMultiplier = 0.3;
            const currentRotation = scrollWithinSection * rotationMultiplier;
            bigHeroCake.setAttribute('camera-orbit', `${currentRotation}deg 75deg auto`);
            
            // Update data attributes for CSS
            bigHeroCake.setAttribute('data-reveal-progress', revealProgress);
            if (revealProgress >= 1) {
                bigHeroCake.removeAttribute('data-skeleton-mode');
            } else {
                bigHeroCake.setAttribute('data-skeleton-mode', 'true');
            }
        }
        
        // Easing function for smooth reveal
        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }
        
        // Throttled scroll handler
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateCakeReveal();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // Initial check
        setTimeout(() => updateCakeReveal(), 200);
        
        // Also check on resize
        window.addEventListener('resize', updateCakeReveal);
        
        // Scroll effect for big-hero section
        function updateBigHeroScrollEffect() {
            const scrollPosition = window.scrollY || window.pageYOffset;
            const bigHeroTop = bigHeroSection.offsetTop;
            const bigHeroHeight = bigHeroSection.offsetHeight;
            const scrollWithinSection = Math.max(0, scrollPosition - bigHeroTop);
            
            // Calculate scroll progress (0 to 1) within the section
            const scrollProgress = Math.min(1, scrollWithinSection / bigHeroHeight);
            
            // Parallax effect: move section slower than scroll
            const parallaxOffset = scrollWithinSection * 0.5; // 50% speed for parallax
            
            // Fade out as user scrolls past the section
            const opacity = Math.max(0, 1 - scrollProgress * 1.5); // Fade out faster
            
            // Scale down slightly as scrolling
            const scale = Math.max(0.8, 1 - scrollProgress * 0.2);
            
            // Apply transforms and opacity
            bigHeroSection.style.transform = `translateY(${parallaxOffset}px) scale(${scale})`;
            bigHeroSection.style.opacity = opacity;
        }
        
        // Add scroll effect handler
        let scrollTicking = false;
        window.addEventListener('scroll', () => {
            if (!scrollTicking) {
                window.requestAnimationFrame(() => {
                    updateBigHeroScrollEffect();
                    scrollTicking = false;
                });
                scrollTicking = true;
            }
        }, { passive: true });
        
        // Initial check for scroll effect
        updateBigHeroScrollEffect();
        
        // Also update on resize
        window.addEventListener('resize', updateBigHeroScrollEffect);
    }

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

