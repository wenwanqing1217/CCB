package com.campusblindbox.box.repository;

import com.campusblindbox.box.entity.Box;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoxRepository extends JpaRepository<Box, String> {
    List<Box> findBySellerId(String sellerId);
    Page<Box> findBySellerId(String sellerId, Pageable pageable);
    Page<Box> findByStatus(String status, Pageable pageable);
    Page<Box> findByStatusAndCategory(String status, String category, Pageable pageable);
}
