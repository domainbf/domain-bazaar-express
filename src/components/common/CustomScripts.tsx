import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const CustomScripts = () => {
  const { config } = useSiteSettings();

  useEffect(() => {
    // Inject head scripts
    if (config.custom_head_script) {
      const existing = document.getElementById('custom-head-script');
      if (existing) existing.remove();
      
      const container = document.createElement('div');
      container.id = 'custom-head-script';
      container.innerHTML = config.custom_head_script;
      
      // Move script tags to head
      const scripts = container.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) newScript.src = script.src;
        else newScript.textContent = script.textContent;
        script.getAttributeNames().forEach(attr => {
          if (attr !== 'src') newScript.setAttribute(attr, script.getAttribute(attr) || '');
        });
        document.head.appendChild(newScript);
      });
      
      // Non-script elements (like meta, link)
      const nonScripts = container.querySelectorAll(':not(script)');
      nonScripts.forEach(el => {
        document.head.appendChild(el.cloneNode(true));
      });
    }

    // Inject body scripts
    if (config.custom_body_script) {
      const existing = document.getElementById('custom-body-script');
      if (existing) existing.remove();
      
      const container = document.createElement('div');
      container.id = 'custom-body-script';
      container.innerHTML = config.custom_body_script;
      
      const scripts = container.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) newScript.src = script.src;
        else newScript.textContent = script.textContent;
        script.getAttributeNames().forEach(attr => {
          if (attr !== 'src') newScript.setAttribute(attr, script.getAttribute(attr) || '');
        });
        document.body.appendChild(newScript);
      });
    }
  }, [config.custom_head_script, config.custom_body_script]);

  return null;
};
