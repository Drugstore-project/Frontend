import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def wait_and_click(driver, by, value, timeout=10):
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        element.click()
        time.sleep(1)
        return element
    except Exception as e:
        print(f"Error clicking {value}: {e}")
        # Try JS Click
        try:
            element = driver.find_element(by, value)
            driver.execute_script("arguments[0].click();", element)
            print("   Used JS Click fallback.")
            time.sleep(1)
            return element
        except:
            raise e

def wait_and_send_keys(driver, by, value, keys, timeout=10):
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )
        element.clear()
        element.send_keys(keys)
        time.sleep(0.5)
        return element
    except Exception as e:
        print(f"Error sending keys to {value}: {e}")
        raise

def test_sales_only():
    print("Starting Quick Sales Test...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    
    try:
        # Login
        print("Logging in...")
        driver.get("http://localhost:3000/auth/login")
        wait_and_send_keys(driver, By.ID, "email", "admin@example.com")
        wait_and_send_keys(driver, By.ID, "password", "admin")
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Sign In')]")
        time.sleep(3)
        
        # Go to Sales
        print("Navigating to New Sale...")
        driver.get("http://localhost:3000/sales/new")
        time.sleep(3)
        
        # Debug Client Selection
        print("Attempting to select client...")
        
        # Strategy: Find the button that contains "client" (case insensitive)
        # The default value is "No client selected", so it should contain "client"
        client_select_xpath = "//button[@role='combobox']//span[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'client')]/parent::button"
        
        try:
            # Scroll to the element first to ensure it's in view (right column)
            btn = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, client_select_xpath))
            )
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", btn)
            time.sleep(1)
            
            btn.click()
            print("Clicked Client Select Button.")
        except Exception as e:
            print(f"Standard click failed: {e}")
            print("Trying index-based selection (First Combobox)...")
            try:
                # Assuming Client Select is the first combobox
                btn = driver.find_elements(By.XPATH, "//button[@role='combobox']")[0]
                driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", btn)
                time.sleep(1)
                btn.click()
                print("Clicked First Combobox.")
            except Exception as ex:
                print(f"Index-based click failed: {ex}")

        time.sleep(2)
        
        # Select first available client option (skipping "No client selected")
        print("Selecting first client option...")
        try:
            # Wait for options to appear
            # We want the second option (index 2) because index 1 is "No client selected"
            option_xpath = "//div[@role='option'][2]"
            
            option = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, option_xpath))
            )
            option.click()
            print("Client selected.")
        except Exception as e:
            print(f"Failed to select option: {e}")
            # Try selecting ANY option that contains text
            try:
                options = driver.find_elements(By.XPATH, "//div[@role='option']")
                print(f"Found {len(options)} options.")
                if len(options) > 1:
                    options[1].click()
                    print("Clicked second option via list index.")
            except Exception as ex:
                print(f"Fallback selection failed: {ex}")
            
        time.sleep(2)
        
        # Complete Sale
        print("Completing Sale...")
        try:
            complete_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Complete Sale')]")
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", complete_btn)
            time.sleep(1)
            complete_btn.click()
            print("Clicked Complete Sale.")
            
            # Wait for Receipt
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Sale Receipt')]"))
            )
            print("Sale Completed Successfully.")
        except Exception as e:
            print(f"Sale completion failed: {e}")

        print("Test Finished.")

    except Exception as e:
        print(f"Test Failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    test_sales_only()
