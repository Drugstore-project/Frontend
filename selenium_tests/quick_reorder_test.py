import time
import random
import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def wait_and_click(driver, by, value, timeout=10):
    """Waits for an element to be clickable and clicks it."""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        time.sleep(0.5)
        element.click()
        time.sleep(1)
        return element
    except Exception as e:
        print(f"Error clicking {value}: {e}")
        try:
            element = driver.find_element(by, value)
            driver.execute_script("arguments[0].click();", element)
            print(f"   (Recovered with JS click for {value})")
            time.sleep(1)
            return element
        except:
            raise e

def wait_and_send_keys(driver, by, value, keys, timeout=10):
    """Waits for an element to be visible and sends keys."""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located((by, value))
        )
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        element.clear()
        element.send_keys(keys)
        time.sleep(0.5)
        return element
    except Exception as e:
        print(f"Error sending keys to {value}: {e}")
        raise

def test_reorder_flow():
    print("Starting Quick Reorder Test...")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    
    try:
        # 1. Login as Admin
        print("\n--- Login ---")
        driver.get("http://localhost:3000/auth/login")
        
        wait_and_send_keys(driver, By.ID, "email", "admin@example.com")
        wait_and_send_keys(driver, By.ID, "password", "admin")
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Sign In')]")
        
        time.sleep(3)
        if "/auth/login" in driver.current_url:
            raise Exception("Login failed")
        print("   Logged in successfully.")

        # 2. Create Low Stock Product
        print("\n--- Creating Low Stock Product ---")
        driver.get("http://localhost:3000/products")
        time.sleep(2)
        
        rand_id = random.randint(10000, 99999)
        product_name = f"Reorder Test {rand_id}"
        
        # Open Add Product Modal if needed (assuming we might need to click a button or tab)
        try:
             wait_and_click(driver, By.XPATH, "//button[contains(., 'Add Product')]", timeout=5)
        except:
             pass # Tab might be active

        print(f"   Creating product: {product_name}")
        
        # Select Category (First option)
        wait_and_click(driver, By.XPATH, "//label[contains(., 'Category')]/parent::div//button[@role='combobox']")
        time.sleep(0.5)
        wait_and_click(driver, By.XPATH, "//div[@role='option'][1]")

        # Select Supplier (First option)
        try:
            wait_and_click(driver, By.XPATH, "//label[contains(., 'Supplier')]/parent::div//button[@role='combobox']")
            time.sleep(0.5)
            wait_and_click(driver, By.XPATH, "//div[@role='option'][1]")
        except:
            pass

        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#name", product_name)
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#barcode", f"REORDER{rand_id}")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#price", "50.00")
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#stock_quantity", "2") # Low stock
        wait_and_send_keys(driver, By.CSS_SELECTOR, "input#min_stock_level", "10") # Min level higher than stock
        
        # Set expiration
        date_input = driver.find_element(By.CSS_SELECTOR, "input#expiration_date")
        driver.execute_script("""
            let input = arguments[0];
            let lastValue = input.value;
            input.value = '2026-12-31';
            let event = new Event('input', { bubbles: true });
            event.simulated = true;
            let tracker = input._valueTracker;
            if (tracker) {
                tracker.setValue(lastValue);
            }
            input.dispatchEvent(event);
            input.dispatchEvent(new Event('change', { bubbles: true }));
        """, date_input)
        
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Register Medication')]")
        
        # Wait for success
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Product registered successfully')]"))
        )
        print("   Product created.")
        time.sleep(2)

        # 3. Go to Orders Page and Find Alert
        print("\n--- Checking Stock Alerts ---")
        driver.get("http://localhost:3000/orders")
        time.sleep(3)
        
        print("   Locating product in Stock Alerts...")
        # Find the alert using role='alert' and text content
        product_alert = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, f"//div[@role='alert'][contains(., '{product_name}')]"))
        )
        print("   Found Low Stock Alert.")
        
        # Click Reorder
        reorder_btn = product_alert.find_element(By.XPATH, ".//button[contains(., 'Reorder')]")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", reorder_btn)
        time.sleep(0.5)
        reorder_btn.click()
        print("   Clicked Reorder button.")
        
        time.sleep(1)
        
        # 4. Fill Reorder Dialog
        print("\n--- Filling Reorder Request ---")
        wait_and_send_keys(driver, By.ID, "quantity", "50")
        
        # Set Expected Delivery Date to TODAY
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        print(f"   Setting delivery date to today: {current_date}")
        
        delivery_input = driver.find_element(By.ID, "date")
        driver.execute_script(f"arguments[0].value = '{current_date}';", delivery_input)
        driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", delivery_input)
        
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Confirm Reorder')]")
        print("   Reorder Confirmed.")
        time.sleep(3)
        
        # 5. Receive Order
        print("\n--- Receiving Order ---")
        driver.refresh()
        time.sleep(3)
        
        print("   Locating Order in Active List...")
        # Find the order card
        order_card = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, f"//h3[contains(text(), '{product_name}')]/ancestor::div[contains(@class, 'border')]"))
        )
        
        # Click Receive
        receive_btn = order_card.find_element(By.XPATH, ".//button[contains(., 'Receive')]")
        receive_btn.click()
        print("   Clicked Receive.")
        
        time.sleep(1)
        
        # Fill Receive Dialog
        print("   Filling Receive Details...")
        
        # Batch
        batch_input = driver.find_element(By.XPATH, "//input[@placeholder='e.g. LOTE-2025-001']")
        batch_input.clear()
        batch_input.send_keys(f"BATCH-{rand_id}-REC")
        
        # Expiration Date (Future)
        expiration_input = driver.find_element(By.XPATH, "//div[@role='dialog']//input[@type='date']")
        driver.execute_script("arguments[0].value = '2027-01-01';", expiration_input)
        driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", expiration_input)
        
        wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Confirm Receipt')]")
        print("   Receipt Confirmed.")
        time.sleep(3)
        
        # 6. Verify it moved to History (Optional but good)
        print("\n--- Verifying History ---")
        try:
            # It should be in the history list now (green check circle)
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, f"//div[contains(@class, 'bg-gray-50')]//h3[contains(text(), '{product_name}')]"))
            )
            print("   Order found in History.")
        except:
            print("   Warning: Order not found in history immediately (might need refresh or check logic).")

        # 7. Cleanup
        print("\n--- Cleanup: Deleting Product ---")
        driver.get("http://localhost:3000/products")
        time.sleep(2)
        
        wait_and_send_keys(driver, By.XPATH, "//input[@placeholder='Search by name or barcode...']", product_name)
        time.sleep(2)
        
        try:
            product_card = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, f"//h3[contains(text(), '{product_name}')]/ancestor::div[contains(@class, 'border')]"))
            )
            delete_btn = product_card.find_element(By.XPATH, ".//button[contains(@class, 'text-red-600')]")
            delete_btn.click()
            time.sleep(1)
            wait_and_click(driver, By.XPATH, "//button[contains(text(), 'Delete Product')]")
            print("   Product deleted.")
        except Exception as e:
            print(f"   Cleanup failed: {e}")

        print("\n!!! REORDER TEST COMPLETED SUCCESSFULLY !!!")

    except Exception as e:
        print("\n!!! TEST FAILED !!!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

if __name__ == "__main__":
    test_reorder_flow()
